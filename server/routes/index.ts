import { Response } from "express";

import { express } from "../app";

const router = express.Router();

/* GET home page. */
router.get("/", function (res: Response) {
    res.render("index", { title: "Express" });
});

module.exports = router;
