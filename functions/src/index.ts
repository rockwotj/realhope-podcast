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
) {
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
  const googleplay = {
    author: AUTHOR,
    image: {
      _attributes: {href: IMAGE},
    },
  };
  const rawvoice = {
    rating: "TV-G",
    location: "Lake Mills, Wisconsin",
    frequency: "Weekly",
  };
  const itunes = {
    author: AUTHOR,
    email: EMAIL,
    category: {_attributes: {text: "Christianity"}},
    owner: flattenWithColonPrefix({
      itunes: {
        name: AUTHOR,
        email: EMAIL,
      },
    }),
    keywords: "realhope,sermon",
    explicit: "no",
    image: {_attributes: {href: IMAGE}},
  };
  const feed = {
    rss: {
      channel: {
        ...flattenWithColonPrefix({googleplay, rawvoice, itunes}),
        title: TITLE,
        author: AUTHOR,
        description: "Real Hope Community Church Sermons in podcast form.",
        language: "en-us",
        updated: new Date().toISOString(),
        generator: "Firebase",
        copyright: "Real Hope Community Church 2024",
        image: {
          url: IMAGE,
          title: TITLE,
          link: SITE,
        },
        pubDate: "", // FILLED IN LATER
        link: FEED_LINK,
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
      author: AUTHOR,
      title,
      pubDate: time,
      enclosure: {
        _attributes: {
          url: link,
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
          duration,
        },
      }),
    });
  });
  resp.status(200)
    .appendHeader("Content-Type", "application/rss+xml")
    .send(js2xml(feed, {compact: true, ignoreComment: true}));
});

exports.generatePodcastEntry = onObjectFinalized(async (event) => {
  logger.info("Generating podcast entry", event);
  const app = initApp();
  const db = getDatabase(app);
  await db.ref(event.data.name.replace(".", "-")).set({
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
  return db.ref(event.data.name).remove();
});
