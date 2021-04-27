import { randomBytes } from 'crypto';
import { EXP, LOG } from '../../resources'
import {Shares} from "../domain";

export default class Shamir {
    private readonly utf8Encoder = new TextEncoder();
    private readonly utf8Decoder = new TextDecoder();

    public generateRandomKey(length: number) {
        return randomBytes(length).toString('hex');
    }

    public split(key: string, numberOfSecrets: number, threshold: number): Shares {
        const keyBytes = this.utf8Encoder.encode(key);
        const shares: Uint8Array[] = new Array(numberOfSecrets)
            .fill(0)
            .map(() => new Uint8Array(keyBytes.length).fill(0));

        for (let i = 0; i < keyBytes.length; i++) {
            const p = this.generate(threshold - 1, keyBytes[i]);
            for (let x = 1; x <= numberOfSecrets; x++) {
                shares[x - 1][i] = this.evaluate(p, x);
            }
        }

        return shares.reduce((acc, val, index) => (
            {
                ...acc,
                [index + 1]: Buffer.from(val).toString('hex'),
            }), {});
    }

    public combine(shares: Shares): string {
        const lengths = new Set(Object.values(shares).map(share => share.length));
        if (lengths.size !== 1) {
            throw new Error('All shapes should have the same length');
        }
        const secretArray = new Uint8Array(Array.from(lengths)[0]);

        for (let i = 0; i < secretArray.length; i++) {
            const keys = Object.keys(shares);
            const points = new Array(keys.length).fill(0).map(() => new Uint8Array(2).fill(0));
            for (let j = 0; j < keys.length; j++) {
                const key = keys[j];
                const shareArray = Uint8Array.from(Buffer.from(shares[key],  'hex'));
                points[j][0] = Number(key);
                points[j][1] = shareArray[i];
            }
            secretArray[i] = this.interpolate(points);
        }

        return this.utf8Decoder.decode(secretArray);
    }

    private generate(d: number, intercept: number): Buffer {
        let p: Buffer;
        do {
            p = randomBytes(d + 1);
        } while (this.degree(p) !== d);
        p[0] = intercept;
        return p;
    }

    private degree(p: Buffer): number {
        const reversedBuffer = p.reverse();
        for (let i = 0; i < reversedBuffer.length; i++) {
            if (reversedBuffer[i] !== 0) {
                return i;
            }
        }
        return 0;
    }

    private evaluate(p: Buffer, x: number): number {
        let result = 0;
        for (let i = p.length - 1; i >= 0; i--) {
            result = this.add(this.mul(result, x), p[i]);
        }
        return result;
    }

    private add(a: number, b: number): number {
        return a ^ b;
    }

    private mul(a: number, b: number) {
        if (a === 0 || b === 0) {
            return 0;
        }
        return EXP[LOG[a] + LOG[b]];
    }

    private interpolate(points: Uint8Array[]) {
        const x = 0;
        let y = 0;
        for (let i = 0; i < points.length; i++) {
            const aX = points[i][0];
            const aY = points[i][1];
            let li = 1;
            for (let j = 0; j < points.length; j++) {
                const bX = points[j][0];
                if (i !== j) {
                    li = this.mul(li, this.div(this.add(x, bX), this.add(aX, bX)));
                }
            }
            y = this.add(y, this.mul(li, aY));
        }
        return y;
    }

    private div(a: number, b: number) {
        return this.mul(a, EXP[255 - LOG[b]]);
    }
}
