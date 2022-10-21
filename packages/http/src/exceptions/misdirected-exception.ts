import { StatusCodes } from "http-status-codes";
import { ExceptionMessage } from "@ipare/core";
import { HttpException } from "./http-exception";

export class MisdirectedException extends HttpException {
  constructor(error?: string | ExceptionMessage) {
    super(StatusCodes.MISDIRECTED_REQUEST, error);
  }
}
