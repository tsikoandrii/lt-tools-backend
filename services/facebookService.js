const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { decodeBase64ToJson } = require("../utils/decodeToken");

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

function buildCookies(cookieArray) {
  return cookieArray.map(c => `${c.name}=${c.value}`).join('; ');
}

function buildAgent(proxy) {
  const proxyUrl = `socks5://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
  return new SocksProxyAgent(proxyUrl);
}

async function requestGraph(token, proxy, path, params = {}, method = "get") {
  const cookies = buildCookies(token.cookies);
  const agent = buildAgent(proxy);

  const res = await axios(`${GRAPH_URL}${path}`, {
    method,
    httpAgent: agent,
    httpsAgent: agent,
    proxy: false,
    params,
    headers: {
      Authorization: `Bearer ${token.token}`,
      'User-Agent': token.ua,
      Cookie: cookies,
      Accept: 'application/json'
    }
  });

  return res.data;
}

async function getMe(multiToken, proxy) {
  const token = decodeBase64ToJson(multiToken);
  return requestGraph(token, proxy, '/me');
}

async function getAdAccounts(multiToken, proxy) {
  const token = decodeBase64ToJson(multiToken);
  return requestGraph(token, proxy, '/me/adaccounts', {
    fields: 'id,name,account_status,business,currency,timezone_name'
  });
}

async function getActiveAds(multiToken, proxy, adAccountId) {
  const token = decodeBase64ToJson(multiToken);

  return requestGraph(
      token,
      proxy,
      `/${adAccountId}/ads`,
      {
        fields: 'id,name,status,effective_status,configured_status,created_time',
        filtering: [
          {
            field: "effective_status",
            operator: "IN",
            value: ["ACTIVE"]
          }
        ]
      }
  );
}

async function getAdsWithPostInfo(multiToken, proxy, adAccountId) {
  const token = decodeBase64ToJson(multiToken);

  // 1. Отримуємо активні Ads з Creative ID
  const adsData = await requestGraph(
    token,
    proxy,
    `/${adAccountId}/ads`,
    {
      fields: 'id,name,creative{ id,object_story_id,object_story_spec }',
      filtering: [
        {
          field: "effective_status",
          operator: "IN",
          value: ["ACTIVE"]
        }
      ]
    }
  );

  if (!adsData?.data) return [];

  const ads = adsData.data;

  // 2. Пробігаємось по Ads і дістаємо postId + title
  const result = ads.map(ad => {
    const creative = ad.creative || {};

    // postId може бути або в object_story_id, або всередині object_story_spec
    let postId = null;
    let postTitle = null;

    // Якщо це публічний (або dark) FB Post
    if (creative.object_story_id) {
      // format: PAGEID_POSTID → нам треба POSTID
      postId = creative.object_story_id;
    }

    // Якщо це сторіс, carousel, image story — назва тут
    if (creative.object_story_spec) {
      const spec = creative.object_story_spec;

      if (spec.link_data?.name) postTitle = spec.link_data.name;
      else if (spec.video_data?.title) postTitle = spec.video_data.title;
      else if (spec.page_welcome_message) postTitle = spec.page_welcome_message;
    }

    return {
      id: ad.id,
      name: ad.name,
      postId,
      postTitle: postTitle || ad.name || null
    };
  });

  return result;
}

async function getPageTokenByPostId(multiToken, proxy, postId) {
  const token = decodeBase64ToJson(multiToken);

  const pagesResponse = await requestGraph(token, proxy, '/me/accounts', {
    fields: 'id,name,access_token'
  });

  if (!pagesResponse?.data?.length) {
    throw new Error('No pages found for this user token');
  }

  const pages = pagesResponse.data;

  const [pageId] = postId.split('_');

  if (!pageId) {
    throw new Error('Invalid postId format. Expected PAGEID_POSTID');
  }

  const page = pages.find(p => p.id === pageId);
  if (!page) {
    throw new Error(`No permissions for this page: ${pageId}`);
  }

  return {
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.access_token
  };
}


async function getComments(multiToken, proxy, postId) {
  const token = decodeBase64ToJson(multiToken);
  return requestGraph(token, proxy, `/${postId}/comments`, {
    fields: 'id,from,message,created_time'
  });
}

async function deleteComment(multiToken, proxy, commentId, pageToken) {
  const token = decodeBase64ToJson(multiToken);

  return requestGraph({ ...token, token: pageToken }, proxy, `/${commentId}`, null, "delete");
}

async function hideComment(multiToken, proxy, commentId, pageToken) {
  const token = decodeBase64ToJson(multiToken);

  return requestGraph({ ...token, token: pageToken }, proxy, `/${commentId}`, {
    is_hidden: true
  }, "post");
}


module.exports = {
  getMe,
  getAdAccounts,
  getActiveAds,
  getComments,
  deleteComment,
  hideComment,
  getAdsWithPostInfo,
  getPageTokenByPostId
};
