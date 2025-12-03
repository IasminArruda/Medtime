module.exports = (sequelize, DataTypes) => {
  const Pesquisa = sequelize.define('Pesquisa', {

    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descricao: {
      type: DataTypes.STRING(1000)
    },
    imgUrl: {
      type: DataTypes.STRING
    },
    conteudo: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  });

  return Pesquisa;
};
