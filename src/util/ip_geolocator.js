const express = require('express');
const axios = require('axios');

// Function to extract real user IP
const getClientIp = (req) => {
    return (
        req.headers['x-forwarded-for']?.split(',')[0] || // Handles proxies/load balancers
        req.headers['cf-connecting-ip'] || // Cloudflare
        req.headers['x-real-ip'] || // Nginx reverse proxy
        req.connection.remoteAddress || // Direct connection
        req.socket.remoteAddress || '' // Fallback
    ).replace(/^::ffff:/, ''); // Remove IPv6 prefix
};

// Function to get country code from IP
const getCountryFromIP = async (ip) => {
    if (!ip || ip.startsWith('192.') || ip.startsWith('10.') || ip.startsWith('172.') || ip === '127.0.0.1') {
        return 'UNKNOWN'; // Private/local IPs
    }

    try {
        const ipURL =  `https://api.country.is/${ip}`
        const response = await axios({
          method: 'GET',
          url: ipURL
        })
        console.log(ipURL)
        //const response = await fetch(`https://ip2c.info/${ip}`);
        //console.log(JSON.stringify(response))
        const data = await response.json();
        
        if (data.startsWith('1')) {
            return data.split(';')[1]; // Country Code (e.g., "US", "DE", "GB")
        }
    } catch (error) {
        console.error('IP Geolocation Error:', error);
    }

    return 'UNKNOWN'; // Fallback if API fails
};

const getGeolocation = async (req) => {
  try {
    // Get public IP
    //const ipRes = await axios.get('https://api.ipify.org?format=json');
    //const ip = ipRes.data.ip;
    const ip = getClientIp(req)
  
    // Get geolocation data based on IP
    const geoRes = await axios.get(`http://ip-api.com/json/${ip}`);

    return {
      status: "success",
      ip: ip,
      countryCode: geoRes.data.countryCode
    }
  } catch (error) {
    console.error('Error fetching geolocation:', error);
    return {
      status: "error",
      ip: "UNKNOWN",
      countryCode: "UNKNOWN"
    }
  }
}

module.exports = {
  getClientIp: getClientIp,
  getCountryFromIP: getCountryFromIP,
  getGeolocation: getGeolocation
}