const users = [
  {
    id: 1,
    name: "John Doe",
  },
  {
    id: 2,
    name: "Jane Doe",
  },
];

// Acá recibís la función callback como un parámetro más
function getUserById(id, callback) {
  const user = users.find(function (user) {
    return user.id === id;
  });

  if (!user) {
    // CASO ERROR: Llamas al callback y le pasas el texto del error.
    // Como no hay usuario, el segundo parámetro no se pone (queda undefined).
    return callback(`User not found with id ${id}`);
  }

  // CASO ÉXITO: Como todo salió bien, el primer parámetro es 'null' (no hay error).
  // El segundo parámetro es el objeto 'user' que encontramos.
  return callback(null, user);
}

module.exports = {
  getUserById,
};
