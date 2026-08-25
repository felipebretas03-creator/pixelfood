import axios from 'axios';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

export const asaasService = {
  /**
   * Cria um cliente no Asaas para o Tenant (Restaurante)
   */
  async createCustomer(tenantData: { name: string, email: string, cpfCnpj?: string, phone?: string }) {
    if (!ASAAS_API_KEY) {
      console.warn('[ASAAS] Chave de API não configurada. Simulando criação de Customer.');
      return { id: 'cus_simulated_' + Date.now() };
    }

    try {
      const response = await asaasClient.post('/customers', {
        name: tenantData.name,
        email: tenantData.email,
        cpfCnpj: tenantData.cpfCnpj || undefined,
        phone: tenantData.phone || undefined,
        notificationDisabled: true // Não envia emails do Asaas
      });
      return response.data; // { id: 'cus_00000', ... }
    } catch (error: any) {
      console.error('[ASAAS Error] createCustomer:', error.response?.data || error.message);
      throw new Error('Falha ao criar cliente no Asaas');
    }
  },

  /**
   * Cria uma assinatura (recorrência) para o cliente no Asaas
   */
  async createSubscription(customerId: string, plan: { value: number, cycle: string, description: string }) {
    if (!ASAAS_API_KEY) {
      console.warn('[ASAAS] Chave de API não configurada. Simulando criação de Subscription.');
      return { id: 'sub_simulated_' + Date.now() };
    }

    try {
      const cycleAsaas = plan.cycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
      
      const response = await asaasClient.post('/subscriptions', {
        customer: customerId,
        billingType: 'UNDEFINED', // Permite Cartão, Boleto ou PIX
        value: plan.value,
        nextDueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // Começa a cobrar amanhã (ou pode ser hoje se preferir)
        cycle: cycleAsaas,
        description: plan.description
      });
      
      return response.data; // { id: 'sub_00000', ... }
    } catch (error: any) {
      console.error('[ASAAS Error] createSubscription:', error.response?.data || error.message);
      throw new Error('Falha ao criar assinatura no Asaas');
    }
  },

  /**
   * Cancela uma assinatura ativa no Asaas
   */
  async cancelSubscription(subscriptionId: string) {
    if (!ASAAS_API_KEY || subscriptionId.startsWith('sub_simulated_')) {
      console.warn('[ASAAS] Cancelamento simulado.');
      return { success: true };
    }

    try {
      const response = await asaasClient.delete(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS Error] cancelSubscription:', error.response?.data || error.message);
      throw new Error('Falha ao cancelar assinatura no Asaas');
    }
  }
};
