import { startServer } from "./startServer";
import { HTTP_PORT } from "./config/config";

startServer(parseInt(HTTP_PORT));
