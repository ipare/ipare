import { StatusCodes } from "http-status-codes";
import { ExceptionMessage } from "@ipare/core";
import { HttpException } from "./http-exception";

export class RequestTooLongException extends HttpException {
  constructor(error?: string | ExceptionMessage) {
    super(StatusCodes.REQUEST_TOO_LONG, error);
  }
}
