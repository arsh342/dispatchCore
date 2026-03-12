const toLegacyUser = (driver) => ({
  id: driver.id,
  name: driver.name ?? null,
  email: driver.email ?? null,
  phone: driver.phone ?? null,
});

const serializeDriver = (driver) => {
  if (!driver) {
    return driver;
  }

  const plain = typeof driver.get === 'function' ? driver.get({ plain: true }) : { ...driver };
  if (!plain.user) {
    plain.user = toLegacyUser(plain);
  }
  return plain;
};

const attachLegacyUserShape = (driver) => {
  if (!driver || !driver.dataValues) {
    return driver;
  }

  driver.dataValues.user = toLegacyUser(driver.dataValues);
  return driver;
};

module.exports = { serializeDriver, attachLegacyUserShape };
