import {
  onObjectFinalized,
  onObjectDeleted,
} from "firebase-functions/v2/storage";
import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getDatabase} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import {js2xml} from "xml-js";
import {once, mapKeys, forEachObj} from "remeda";

const initApp = once(() => initializeApp({
  databaseURL: "https://real-hope-podcast-default-rtdb.firebaseio.com",
}));

/**
 * A function that flattens objects by adding keys with prefixes.
 *
 * @param {object} objects {a: {b: 5, c: 6}, b: {b: 3}}
 *
 * @return {object} like {"a:b": 5, "a:c": 6, "b:b": 3}
 */
function flattenWithColonPrefix(
  objects: Record<string, Record<string, unknown>>
): Record<string, unknown> {
  let result = {};
  forEachObj.indexed(objects, (val, key) => {
    result = {...result, ...mapKeys(val, (child) => `${key}:${child}`)};
  });
  return result;
}

const TITLE = "Real Hope Community Church Sermons";
const AUTHOR = "Real Hope Community Church";
const EMAIL = "office@realhopecc.com";
const IMAGE = "https://real-hope-podcast.web.app/realhope_logo.jpg";
const SITE = "https://real-hope-podcast.web.app/";
const FEED_LINK = "https://real-hope-podcast.web.app/feed.rss";

exports.generatePodcastFeed = onRequest(async (_req, resp) => {
  const itunes = {
    author: AUTHOR,
    category: {_attributes: {text: "Religion &amp; Spirituality"}},
    owner: flattenWithColonPrefix({
      itunes: {
        name: AUTHOR,
        email: EMAIL,
      },
    }),
    keywords: "realhope,sermon",
    explicit: "false",
    image: {_attributes: {href: IMAGE}},
  };
  const atom = {
    link: {
      _attributes: {
        href: FEED_LINK,
        rel: "self",
        type: "application/rss+xml",
      },
    },
  };
  const feed = {
    rss: {
      _attributes: {
        version: "2.0",
        ...flattenWithColonPrefix({
          xmlns: {
            itunes: "http://www.itunes.com/dtds/podcast-1.0.dtd",
            content: "http://purl.org/rss/1.0/modules/content/",
            atom: "http://www.w3.org/2005/Atom",
            podcast: "https://podcastindex.org/namespace/1.0",
            media: "http://search.yahoo.com/mrss/",
          },
        }),
      },
      channel: {
        ...flattenWithColonPrefix({itunes, atom}),
        title: TITLE,
        category: "Religion &amp; Spirituality",
        description: "Real Hope Community Church Sermons in podcast form.",
        language: "en-us",
        lastBuildDate: new Date().toUTCString(),
        generator: "Firebase",
        copyright: "Real Hope Community Church",
        image: {
          url: IMAGE,
          title: TITLE,
          link: SITE,
        },
        pubDate: "", // FILLED IN LATER
        link: SITE,
        item: [] as unknown[],
      },
    },
  };
  const app = initApp();
  const db = getDatabase(app);
  const snap = await db.ref("sermons").limitToLast(1000).get();
  snap.forEach((snap) => {
    const snapdata = snap.toJSON() as Record<string, string>;
    const {link, title, time, duration, size} = snapdata;
    if (!feed.rss.channel.pubDate) {
      feed.rss.channel.pubDate = time;
    }
    feed.rss.channel.item.push({
      title,
      pubDate: time,
      enclosure: {
        _attributes: {
          url: link.replaceAll("&", "&amp;"),
          type: "audio/mpeg",
          length: size,
        },
      },
      guid: {
        _attributes: {
          isPermaLink: false,
        },
        _text: snap.key,
      },
      ...flattenWithColonPrefix({
        itunes: {
          author: AUTHOR,
          duration,
          image: {_attributes: {href: IMAGE}},
          episodeType: "full",
          explicit: "false",
        },
      }),
    });
  });
  const xmlFeed = js2xml(feed, {compact: true, ignoreComment: true});
  resp.status(200)
    .appendHeader("Content-Type", "application/rss+xml")
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n${xmlFeed}`);
});

exports.generatePodcastEntry = onObjectFinalized(async (event) => {
  logger.info("Generating podcast entry", event);
  const app = initApp();
  const db = getDatabase(app);
  const path = event.data.name.replaceAll(".", "-");
  console.log("generating entry at", path);
  await db.ref(path).set({
    link: event.data.mediaLink,
    title: event.data.metadata?.title,
    time: event.data.metadata?.date,
    duration: event.data.metadata?.duration,
    size: event.data.size.toString(),
  });
});

exports.removePodcastEntry = onObjectDeleted((event) => {
  logger.info("Removing podcast entry", event);
  const app = initApp();
  const db = getDatabase(app);
  return db.ref(event.data.name.replaceAll(".", "-")).remove();
});
