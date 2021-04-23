import {randomBytes} from 'crypto';
import Decimal from 'decimal.js';

export default class Mignotte {
    private readonly Q = [179424673, 179426549, 179428399, 179430413, 179432233, 179434033];
    private readonly K = 3;
    private a = 1;
    private b = 1;
    private M = 1;
    private bitsPerSecret: number;
    private bytesPerSecret: number;

    constructor() {
        Decimal.set({precision: 1})
        this.Q.slice(-2).forEach((val) => this.a *= val);
        this.a++;
        this.Q.slice(0, 3).forEach((val) => this.b *= val);
        this.b--;
        this.Q.forEach((val) => this.M *= val);
        this.bitsPerSecret = Math.log(this.b - this.a);
        this.bytesPerSecret = this.bitsPerSecret / 8;
    }

    public generateRandomKey(length: number) {
        return randomBytes(length).toString('hex');
    }

    public split(key: string): Shares {
        let keyDecimal = this.keyToDecimal(key);
        keyDecimal += this.a;
        return this.Q.reduce((acc, val, i) => ({
            ...acc,
            [i + 1]: keyDecimal % val,
        }), {});
    }

    private keyToDecimal(key: string): number {
        let num = 0;
        for (let i = 0; i < this.bytesPerSecret; i++) {
            num *= 256;
            if (i < key.length) {
                num += key.charCodeAt(i);
            }
        }
        return num;
    }

    public combine(shares: Shares): string {
        let S = 0;
        const shareNumbers: number[] = Object.values(shares);
        for (let i = 0; i < this.K; i++) {
            const mprime = this.M % this.Q[i];
            S += (shareNumbers[i] * this.exteuclid(this.Q[i], mprime) * mprime);
        }
        S -= this.a;
        S %= this.b;
        return this.numberToKey(S);
    }

    private exteuclid(u1: number, v1: number) {
        const u = [1, 0, u1];
        const v = [0, 1, v1];
        const t = [];
        while (v[2] !== 0) {
            const q = u[2] / v[2];
            for (let i = 0; i < 3; i++) {
                t[i] = u[i] - q * v[i];
            }
            for (let i = 0; i < 3; i++) {
                u[i] = v[i];
            }
            for (let i = 0; i < 3; i++) {
                v[i] = t[i];
            }
        }
        return u[1];
    }

    private numberToKey(number: number): string {
        let string = '';
        while (number > 0) {
            string += String.fromCharCode(number % 256);
            number /= 256;
        }
        return string;
    }
}

export interface Shares {
    [key: number]: number;
}
