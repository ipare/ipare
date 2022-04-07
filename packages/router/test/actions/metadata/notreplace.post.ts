import { Dict } from "@sfajs/core";
import { Action, defineRouterMetadata } from "../../../src";

function CustomMetadata(metadata: Dict) {
  return function (target: any) {
    defineRouterMetadata(target, metadata);
  };
}

@CustomMetadata({
  custom1: "1",
})
@CustomMetadata({
  custom2: "2",
})
export default class extends Action {
  async invoke(): Promise<void> {
    //
  }
}
