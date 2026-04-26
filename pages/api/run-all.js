const { startWorker } = require('../../worker');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🚀 Ejecución manual de TODOS los usuarios iniciada desde el Panel Admin');
    
    // Lo ejecutamos en segundo plano para no exceder el timeout de la respuesta HTTP
    // El usuario verá los resultados refrescando la página o esperando a que el scheduler termine
    startWorker().catch(err => console.error('Error en startWorker manual:', err));

    res.status(200).json({ 
      message: 'Proceso masivo iniciado en segundo plano. Los resultados aparecerán en unos minutos.' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error iniciando proceso masivo: ' + error.message });
  }
}
