const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('medtime', 'root', '26ZK10q2', {
  host: 'localhost',
  dialect: 'mysql'
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.users = require('../models/user.js')(sequelize, Sequelize);
db.alarmes = require('../models/alarme.js')(sequelize, Sequelize);
db.curiosidades = require('../models/curiosidade.js')(sequelize, Sequelize);
db.pesquisas = require('../models/pesquisa.js')(sequelize, Sequelize);
db.users.hasMany(db.alarmes);
db.alarmes.belongsTo(db.users);

sequelize.authenticate()
  .then(() => {
    console.log('Conectado ao banco de dados MySQL com sucesso! (Usando Sequelize)');
  })
  .catch(err => {
    console.error('Erro ao conectar ao MySQL com Sequelize:', err);
  });

module.exports = db;
