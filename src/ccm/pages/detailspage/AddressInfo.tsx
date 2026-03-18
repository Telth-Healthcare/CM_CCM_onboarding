// src/ccm/pages/detailspage/AddressInfo.tsx
import React, { useEffect } from "react";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import SearchableSelect from "../../../shared/components/common/SearchableSelect"; // same as SHGInfo
import { useLocationData } from "../../../shared/hooks/useLocationData";          // existing hook
import { StepProps } from "./types";

const AddressInfo: React.FC<StepProps> = ({ formData, updateFormData, errors }) => {
  if (!formData) return null;

  const {
    countries, states, districts,
    loadingCountries, loadingStates, loadingDistricts,
    fetchStates, fetchDistricts,
    resetStates, resetDistricts,
  } = useLocationData();

  // ── On revisit — restore states + districts if already selected ───────────
  useEffect(() => {
    if (formData.country) fetchStates(formData.country);        // reload states for saved country
  }, []);

  useEffect(() => {
    // Once countries list loads — restore districts for saved state
    if (formData.country && formData.state && countries.length > 0) {
      const countryName = countries.find(c => c.value === formData.country)?.label ?? "";
      if (countryName) fetchDistricts(countryName, formData.state);
    }
  }, [countries]);

  // ── Country change → reset state + city, fetch new states ────────────────
  const handleCountryChange = (cca2: string) => {
    updateFormData("country", cca2);
    updateFormData("state", "");   // clear state
    updateFormData("city", "");   // clear city (mapped to district in backend)
    if (cca2) fetchStates(cca2);
    else resetStates();
  };

  // ── State change → reset city, fetch new districts ────────────────────────
  const handleStateChange = (stateName: string) => {
    updateFormData("state", stateName);
    updateFormData("city", "");     // clear city
    if (stateName) {
      const countryName = countries.find(c => c.value === formData.country)?.label ?? "";
      fetchDistricts(countryName, stateName);
    } else {
      resetDistricts();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">
        Address Information
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Enter your address details
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Address Line 1 — full width */}
        <div className="sm:col-span-2">
          <Label htmlFor="addressLine1">Address Line 1</Label>
          <Input
            type="text" id="addressLine1" name="addressLine1"
            placeholder="Door No, Street Name"
            value={formData.addressLine1}
            onChange={e => updateFormData("addressLine1", e.target.value)}
          />
        </div>

        {/* Address Line 2 — full width */}
        <div className="sm:col-span-2">
          <Label htmlFor="addressLine2">Address Line 2</Label>
          <Input
            type="text" id="addressLine2" name="addressLine2"
            placeholder="Area, Landmark (optional)"
            value={formData.addressLine2}
            onChange={e => updateFormData("addressLine2", e.target.value)}
          />
        </div>

        {/* Country — dynamic from restcountries */}
        <div>
          <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
          <SearchableSelect
            value={formData.country}
            onChange={handleCountryChange}
            options={countries}
            placeholder={loadingCountries ? "Loading countries…" : "Select Country"}
            disabled={true}   // ← just change this line
            error={!!errors?.country}
            hint={errors?.country}
          />
        </div>

        {/* State — unlocks after country selected */}
        <div>
          <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
          <SearchableSelect
            value={formData.state}
            onChange={handleStateChange}
            options={states}
            placeholder={
              !formData.country ? "Select country first"
                : loadingStates ? "Loading states…"
                  : states.length === 0 ? "No states available"
                    : "Select State"
            }
            disabled={!formData.country || loadingStates}
            error={!!errors?.state}
            hint={errors?.state}
          />
        </div>

        {/* City/District — unlocks after state selected */}
        <div>
          <Label htmlFor="city">City / District <span className="text-red-500">*</span></Label>
          <SearchableSelect
            value={formData.city}
            onChange={val => updateFormData("city", val)}  // city maps to district in backend
            options={districts}
            placeholder={
              !formData.state ? "Select state first"
                : loadingDistricts ? "Loading cities…"
                  : districts.length === 0 ? "No cities available"
                    : "Select City"
            }
            disabled={!formData.state || loadingDistricts}
            error={!!errors?.city}
            hint={errors?.city}
          />
        </div>

        {/* Zipcode */}
        <div>
          <Label htmlFor="zipcode">Zipcode <span className="text-red-500">*</span></Label>
          <Input
            type="text" id="zipcode" name="zipcode"
            placeholder="Enter 6-digit PIN code"
            value={formData.zipcode}
            onChange={e => updateFormData("zipcode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            error={!!errors?.zipcode}
            hint={errors?.zipcode}
          />
        </div>

      </div>
    </div>
  );
};

export default AddressInfo;