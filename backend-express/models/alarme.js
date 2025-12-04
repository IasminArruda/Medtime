module.exports = (sequelize, DataTypes) => {
  const Alarme = sequelize.define('Alarme', {
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dose: {
      type: DataTypes.STRING,
      allowNull: false
    },
    intervalo: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    horaI: {
      type: DataTypes.STRING,
      allowNull: false
    },
    duracao: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  });

  return Alarme;
};
