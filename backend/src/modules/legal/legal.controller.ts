import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { TERMS_HTML } from './terms-content';
import { PRIVACY_HTML } from './privacy-content';

@Controller('legal')
export class LegalController {
  @Get('terms')
  getTerms(@Res() res: Response) {
    res.type('text/html').send(TERMS_HTML);
  }

  @Get('privacy')
  getPrivacy(@Res() res: Response) {
    res.type('text/html').send(PRIVACY_HTML);
  }
}
