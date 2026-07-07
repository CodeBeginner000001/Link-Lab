import bwipjs from '@bwip-js/node';
import { Injectable } from '@nestjs/common';
import { BarcodeGenerationException } from 'src/exceptions/barcode.exception';
import { BARCODE_RENDERER_FORMAT } from './barcode-generator.constants';
import { GenerateBarcodeDto } from './dto/barcode-generator.dto';

export type BarcodeRawSymbol = {
  sbs: number[];
  bhs: number[];
  bbs: number[];
};

@Injectable()
export class BarcodeRendererService {
  renderSvg(dto: GenerateBarcodeDto): string {
    try {
      return bwipjs.toSVG(this.buildRenderOptions(dto));
    } catch (error) {
      throw this.toGenerationException(error);
    }
  }

  async renderPng(dto: GenerateBarcodeDto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      bwipjs.toBuffer(this.buildRenderOptions(dto), (error, png) => {
        if (error) {
          reject(this.toGenerationException(error));
          return;
        }

        resolve(png);
      });
    });
  }

  renderRawLinear(dto: GenerateBarcodeDto): BarcodeRawSymbol {
    try {
      const raw = bwipjs.raw({
        ...this.buildRenderOptions(dto),
        includetext: false,
      });
      const [symbol] = raw as BarcodeRawSymbol[];

      return symbol;
    } catch (error) {
      throw this.toGenerationException(error);
    }
  }

  private buildRenderOptions(dto: GenerateBarcodeDto): bwipjs.RenderOptions {
    const scale = dto.barWidth;
    const padding = Math.round(dto.margin / scale);
    const heightInMillimeters = Number((dto.height / 2.835 / scale).toFixed(2));

    return {
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
    };
  }

  private toGenerationException(error: unknown) {
    const message =
      error instanceof Error || typeof error === 'string'
        ? String(error)
        : undefined;

    return new BarcodeGenerationException(message);
  }
}
