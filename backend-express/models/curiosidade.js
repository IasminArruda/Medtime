module.exports = (sequelize, DataTypes) => {
  const Curiosidade = sequelize.define('Curiosidade', {

    descricao: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  });

  return Curiosidade;
};
