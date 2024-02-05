import {onObjectFinalized, onObjectDeleted} from "firebase-functions/v2/storage";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

exports.generatePodcastFeed = onRequest((req, resp) => {

});

exports.generatePodcastEntry = onObjectFinalized((event) => {

});

exports.removePodcastEntry = onObjectDeleted(() => {
  // TODO: Remove an entry
});
