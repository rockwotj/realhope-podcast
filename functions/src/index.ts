import {onObjectFinalized, onObjectDeleted} from "firebase-functions/v2/storage";
import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from 'firebase-admin/app';
import {getDatabase} from 'firebase-admin/database';
import * as logger from "firebase-functions/logger";
import {js2xml} from 'xml-js';
import {once, mapKeys, forEachObj} from "remeda";

const initApp = once(() => initializeApp({
  databaseURL: "https://real-hope-podcast-default-rtdb.firebaseio.com",
}));

function flattenWithColonPrefix(objects: Record<string, Record<string, unknown>>) {
  let result = {};
  forEachObj.indexed(objects, (val, key) => {
    result = {...result, ...mapKeys(val, (child) => `${key}:${child}`)};
  });
  return result;
}

exports.generatePodcastFeed = onRequest(async (_req, resp) => {
  const googleplay = {
    author: '',
    image: {
      _attributes: {href: ''}
    }
  };
  const rawvoice = {
    rating: 'TV-G',
    location: 'Lake Mills, Wisconsin',
    frequency: 'Weekly',
  };
  const itunes = {
    author: '',
    email: '',
    category: {_attributes: {text: 'Christianity'}},
    owner: flattenWithColonPrefix({
      itunes: {
        name: '',
        email: '',
      },
    }),
    keywords: 'realhope,sermon',
    explicit: 'no',
    image: {_attributes: {href: ''}},
  };
  const feed = {
    rss: {
      channel: {
        ...flattenWithColonPrefix({googleplay, rawvoice, itunes}),
        title: "Real Hope Community Church Sermons",
        author: '',
        description: `Real Hope Community Church Sermons in podcast form.`,
        language: "en-us",
        updated: new Date(),
        generator: "Firebase",
        copyright: "Real Hope Community Church 2024",
        image: {
          url: '',
          title: '',
          link: '',
        },
        pubDate: '',
        link: '',
        item: [] as unknown[],
      },
    }
  };
  const app = initApp();
  const db = getDatabase(app);
  const snap = await db.ref("sermons").limitToLast(1000).get();
  snap.forEach((snap) => {
    const {link, title, time, duration, size} = snap.toJSON() as Record<string, string>;
    feed.rss.channel.item.push({
      author: '',
      title,
      pubDate: time,
      enclosure: {
        _attributes: {
          url: link,
          type: 'audio/mpeg',
          length: size,
        },
      },
      guid: {
        _attributes: {
          isPermaLink: false
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
  resp.status(200).send(js2xml(feed, {compact: true, ignoreComment: true}));
});

exports.generatePodcastEntry = onObjectFinalized(async (event) => {
  const app = initApp();
  const db = getDatabase(app);
  await db.ref(event.data.name).set({
    link: event.data.mediaLink,
    title: event.data.metadata?.title,
    time: new Date(event.data.timeCreated?.toString()!).toUTCString(),
    duration: event.data.metadata?.duration,
    size: event.data.size.toString(),
  });
});

exports.removePodcastEntry = onObjectDeleted((event) => {
  const app = initApp();
  const db = getDatabase(app);
  return db.ref(event.data.name).remove();
});
