import { StatusCodes } from "http-status-codes";
import { ExceptionMessage } from "@ipare/core";
import { HttpException } from "./http-exception";

export class RequestTimeoutException extends HttpException {
  constructor(error?: string | ExceptionMessage) {
    super(StatusCodes.REQUEST_TIMEOUT, error);
  }
}
