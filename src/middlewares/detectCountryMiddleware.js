// Invoke config variables
require('dotenv').config();

// Invoke utility methods
const geolocatorUtils = require('../util/ip_geolocator')

const detectCountryMiddleware = async (req, res, next) => {
  const ip = geolocatorUtils.getClientIp(req)
  req.userCountry = await geolocatorUtils.getCountryFromIP(ip)
  next();
};

const detectIPandCountry = async(req, res, next) => {
    const ipData = await geolocatorUtils.getGeolocation(req)
    req.userIP = ipData.ip
    req.userCountry = ipData.countryCode
    next()
}

module.exports = {
    detectCountryMiddleware: detectCountryMiddleware,
    detectIPandCountry: detectIPandCountry
}