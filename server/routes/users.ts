import { Response } from "express";

import { express } from "../app";

const router = express.Router();

/* GET users listing. */
router.get("/", function (res: Response) {
    res.send("respond with a resource");
});

module.exports = router;
