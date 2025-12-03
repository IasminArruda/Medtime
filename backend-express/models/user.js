module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {

    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },

    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    }
  });

  return User;
};
