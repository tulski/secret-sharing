import {randomBytes} from 'crypto';
import Decimal from 'decimal.js';

export default class Mignotte {
    private readonly Q = [179424673, 179426549, 179428399, 179430413, 179432233, 179434033];
    private readonly K = 3;
    private a = new Decimal(1);
    private b = new Decimal(1);
    private M = new Decimal(1);
    private bitsPerSecret: Decimal;
    private bytesPerSecret: Decimal;

    constructor() {
        Decimal.set({precision: 1})
        this.Q.slice(-2).forEach((val) => this.a = this.a.mul(val));
        this.a.add(1);
        this.Q.slice(0, 3).forEach((val) => this.b = this.b.mul(val));
        this.b.sub(1);
        this.Q.forEach((val) => this.M = this.M.mul(val));
        this.bitsPerSecret = Decimal.log2(Decimal.sub(this.b, this.a));
        this.bytesPerSecret = this.bitsPerSecret.div(8);
    }

    public generateRandomKey(length: number) {
        return randomBytes(length).toString('hex');
    }

    public split(key: string): Shares {
        let keyDecimal = this.keyToDecimal(key);
        keyDecimal = keyDecimal.add(this.a);
        return this.Q.reduce((acc, val, i) => ({
            ...acc,
            [i + 1]: Decimal.mod(keyDecimal, val).toString(),
        }), {});
    }

    private keyToDecimal(key: string): Decimal {
        let num = new Decimal(0);
        for (let i = 0; i < this.bytesPerSecret.toNumber(); i++) {
            num = num.mul(256);
            if (i < key.length) {
                num = num.add(key.charCodeAt(i))
            }
        }
        return num;
    }

    public combine(shares: Shares): string {
        let S = new Decimal(0);
        const shareNumbers: string [] = Object.values(shares);
        for (let i = 0; i < this.K; i++) {
            const mprime = Decimal.div(this.M, this.Q[i]);
            S = Decimal.add(S, Decimal.mul(Decimal.mul(shareNumbers[i], this.exteuclid(this.Q[i], mprime.toNumber())), mprime))
        }
        S = S.sub(this.a);
        S = S.mod(this.b);

        return this.decimalToKey(S);
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

    private decimalToKey(decimal: Decimal): string {
        let x = decimal;
        let string = '';
        while (x.greaterThan(0)) {
            string += String.fromCharCode(Decimal.mod(x,256).toNumber());
            x = x.div(256);

        }
        return string;
    }
}

export interface Shares {
    [key: number]: string;
}
