import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@muzkle/contracts';

export class DomainException extends HttpException {
  constructor(code: ErrorCode, message: string, status = HttpStatus.BAD_REQUEST) {
    super({ code, message }, status);
  }
}
