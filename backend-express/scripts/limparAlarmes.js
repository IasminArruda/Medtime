const db = require('../config/db');

async function limparAlarmes() {
  try {
    console.log('Conectando ao banco de dados...');

    await db.sequelize.authenticate();
    console.log('✓ Conectado ao banco de dados com sucesso!');

    console.log('\nLimpando todos os alarmes...');
    const resultado = await db.alarmes.destroy({ where: {} });

    console.log(`✓ ${resultado} alarmes foram excluídos com sucesso!`);
    console.log('\nBanco de dados de alarmes foi resetado.');

    process.exit(0);
  } catch (error) {
    console.error('✗ Erro ao limpar alarmes:', error);
    process.exit(1);
  }
}

limparAlarmes();
