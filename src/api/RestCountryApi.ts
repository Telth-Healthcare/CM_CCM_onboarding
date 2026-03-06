import axios from "axios";
import { baseUrl } from "../config/env";
import { handleAxiosError } from "../utils/handleAxiosError";

const countriesdetails = "https://restcountries.com/v3.1/all/?fields=cioc,cca2,tld,idd,currencies,name,flags";

export const getCountry = async () => {
  try {
    const response = await axios.get(countriesdetails);
    return response.data;
  } catch (error) {
    console.error("Error fetching country data:", error);
    throw error;
  }
};
   
const getCountryDetail = async () => {
    try {
      const response = await axios.get(`${baseUrl}countries/`);
        return response.data;
    } catch (error) {
        handleAxiosError(error);
    }
};
 

const deleteCountry = (id: string) => {
    return axios.delete(`${baseUrl}countries/${id}/`)
        .then(res => res.data)
}

const createCountry = (response: any) => {
    return axios.post(`${baseUrl}countries/`, response)
        .then(res => res.data)
}

const updateCountry = (response: any, id:string) => {
    return axios.put(`${baseUrl}countries/${id}/`, response)
        .then(res => res.data)
}

export {
  getCountryDetail,
  deleteCountry,
  createCountry,
  updateCountry,
}

