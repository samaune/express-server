import basicAuth from "express-basic-auth";
import config from '../../config/index.js';

export default {
    basic_auth: (router) => {
        // Add Basic authentication to our API.
        if (config.auth && config.auth.basic !== undefined) {
            router.use(basicAuth(config.auth.basic));
        }
    }
}