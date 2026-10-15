// Externalizado para conformidade com CSP Estrito (Observatory A+)
const SUPABASE_URL = "https://fzoyldcfyiigwyxxhosd.supabase.co";
    const SUPABASE_KEY = "sb_publishable_asGr3f2xfay96fUJAkIHBg_L5vfLYvv";

    // Registra o download real na telemetria
    try {
      let id = localStorage.getItem('nutri_device_id') || ('dev_' + Math.random().toString(36).substring(2, 10));
      fetch(`${SUPABASE_URL}/rest/v1/app_telemetria`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          device_id: id,
          evento: 'download_apk',
          cidade: 'App Download',
          metadata: { rota: '/app/' },
          created_at: new Date().toISOString()
        })
      }).finally(() => {
        window.location.href = "./NutriPreco.apk";
      });
    } catch(e) {
      window.location.href = "./NutriPreco.apk";
    }
