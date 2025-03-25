import axios from 'axios';

export class AsaasService {
  private readonly baseUrl = 'https://api.asaas.com/v3';
  private readonly accessToken = process.env.ASAAS_ACCESS_TOKEN;

  async createPixPayment(payload: any): Promise<any> {
    const url = `${this.baseUrl}/pix/qrCodes/static`;
    try {
      const response = await axios.post(url, payload, {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          access_token: this.accessToken,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Erro ao criar pagamento Asaas');
    }
  }

  async cancelPixPayment(paymentId: string): Promise<any> {
    const url = `${this.baseUrl}/pix/qrCodes/static/${paymentId}`;
    try {
      const response = await axios.delete(url, {
        headers: {
          accept: 'application/json',
          access_token: this.accessToken,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Erro ao cancelar pagamento Asaas');
    }
  }
}
