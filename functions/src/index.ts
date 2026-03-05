import {setGlobalOptions} from "firebase-functions/v2";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

setGlobalOptions({maxInstances: 10});

export const hello = onRequest((req, res) => {
  logger.info("hello called", {method: req.method, path: req.path});
  res.status(200).send("Hello from Firebase!");
});
