/**
 * NutriPreço • Decodificador Óptico de NFC-e (SEFAZ-RJ) — Demanda 6
 * Integração com Html5Qrcode Scanner.
 * Garantia Rígida de LGPD: Descarte total de CPF de consumidor em memória volátil.
 */

const SefazRJScanner = {
  isNFCeQRCode: function(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return lower.includes('fazenda.rj.gov.br') || lower.includes('consultanfce') || lower.includes('qrcode?p=');
  },

  parseQRCode: function(url) {
    try {
      const urlObj = new URL(url);
      const pParam = urlObj.searchParams.get('p');
      if (!pParam) return null;

      const parts = pParam.split('|');
      const chave = parts[0];

      if (chave.length !== 44) {
        console.warn('[NFC-e] Chave com tamanho inválido:', chave.length);
        return null;
      }

      const uf = chave.substring(0, 2); // 33 = RJ
      const aamm = chave.substring(2, 6); // Ano Mês
      const cnpjRaw = chave.substring(6, 20);
      const modelo = chave.substring(20, 22);
      const serie = chave.substring(22, 25);
      const nNF = chave.substring(25, 34);

      const cnpjFormatado = `${cnpjRaw.substring(0,2)}.${cnpjRaw.substring(2,5)}.${cnpjRaw.substring(5,8)}/${cnpjRaw.substring(8,12)}-${cnpjRaw.substring(12,14)}`;
      
      const valorTotal = (parts.length > 5 && parts[5]) ? parseFloat(parts[5].replace(',', '.')) : null;

      // LGPD: NUNCA capturar campos que contenham CPF do consumidor (parts[3])
      return {
        tipo: 'NFCE_SEFAZ_RJ',
        valido: true,
        uf: uf === '33' ? 'RJ' : uf,
        chaveAcesso: chave,
        cnpjSupermercado: cnpjFormatado,
        numeroNota: parseInt(nNF, 10),
        dataAnoMes: `20${aamm.substring(0,2)}-${aamm.substring(2,4)}`,
        valorTotal: valorTotal,
        lgpdBlindado: true
      };
    } catch (e) {
      console.error('[NFC-e] Erro ao decodificar QR Code:', e);
      return null;
    }
  }
};

if (typeof window !== 'undefined') {
  window.SefazRJScanner = SefazRJScanner;
}
