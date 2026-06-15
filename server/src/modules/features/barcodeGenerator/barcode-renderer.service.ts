import bwipjs from '@bwip-js/node';
import { Injectable } from '@nestjs/common';
import { BarcodeGenerationException } from 'src/exceptions/barcode.exception';
import { BARCODE_RENDERER_FORMAT } from './barcode-generator.constants';
import { GenerateBarcodeDto } from './dto/barcode-generator.dto';

@Injectable()
export class BarcodeRendererService {
  renderSvg(dto: GenerateBarcodeDto): string {
    const scale = dto.barWidth;
    const padding = Math.round(dto.margin / scale);
    const heightInMillimeters = Number((dto.height / 2.835 / scale).toFixed(2));

    try {
      return bwipjs.toSVG({
        bcid: BARCODE_RENDERER_FORMAT[dto.format],
        text: dto.content.trim(),
        scale,
        height: heightInMillimeters,
        paddingleft: padding,
        paddingright: padding,
        paddingtop: padding,
        paddingbottom: padding,
        includetext: dto.showValue,
        textxalign: 'center',
        barcolor: dto.barColor,
        textcolor: dto.barColor,
        backgroundcolor: dto.backgroundColor,
      });
    } catch (error) {
      const message =
        error instanceof Error || typeof error === 'string'
          ? String(error)
          : undefined;

      throw new BarcodeGenerationException(message);
    }
  }
}
