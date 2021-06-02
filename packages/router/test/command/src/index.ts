import { Request, SimpleStartup } from "sfa";
import "sfa-router";

export const main = async (): Promise<unknown> => {
  return new SimpleStartup(new Request()).useRouter().run();
};
