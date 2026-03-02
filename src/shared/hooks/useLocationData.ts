// shared/hooks/useLocationData.ts
import { useState, useEffect } from 'react'
import axios from 'axios'

// ── API endpoints ─────────────────────────────────────────────────────────────
const COUNTRIES_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2'
const STATES_URL    = 'https://countriesnow.space/api/v0.1/countries/states'        // POST { iso2 }
const CITIES_URL    = 'https://countriesnow.space/api/v0.1/countries/state/cities'  // POST { country, state }

interface Option {
  label: string
  value: string
}

interface UseLocationData {
  countries:        Option[]
  states:           Option[]
  districts:        Option[]   // cities/districts of selected state
  loadingCountries: boolean
  loadingStates:    boolean
  loadingDistricts: boolean
  fetchStates:      (cca2: string) => void
  fetchDistricts:   (countryName: string, stateName: string) => void
  resetStates:      () => void
  resetDistricts:   () => void
}

export const useLocationData = (): UseLocationData => {
  const [countries,        setCountries       ] = useState<Option[]>([])
  const [states,           setStates          ] = useState<Option[]>([])
  const [districts,        setDistricts       ] = useState<Option[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingStates,    setLoadingStates   ] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)

  // ── Countries: fetch once on mount from restcountries ────────────────────
  useEffect(() => {
    setLoadingCountries(true)
    axios.get(COUNTRIES_URL)
      .then(res => {
        const sorted: Option[] = res.data
          .map((c: any) => ({
            label: c.name.common,  // "India", "United States" etc.
            value: c.cca2,         // "IN", "US" — ISO2 used for state fetch
          }))
          .sort((a: Option, b: Option) => a.label.localeCompare(b.label))
        setCountries(sorted)
      })
      .catch(() => setCountries([]))
      .finally(() => setLoadingCountries(false))
  }, [])

  // ── States: POST to countriesnow with ISO2 code ───────────────────────────
  // countriesnow needs the full country name for city fetch, so we also store
  // the country name label inside each state option as a helper.
  const fetchStates = (cca2: string) => {
    if (!cca2) { setStates([]); setDistricts([]); return }

    setLoadingStates(true)
    setStates([])
    setDistricts([]) // reset districts when country changes

    axios.post(STATES_URL, { iso2: cca2 })
      .then(res => {
        const list: any[] = res.data?.data?.states ?? []
        setStates(
          list.map(s => ({
            label: s.name,                    // "Tamil Nadu"
            value: s.name,                    // use name as value (needed for city fetch)
          }))
        )
      })
      .catch(() => setStates([]))
      .finally(() => setLoadingStates(false))
  }

  // ── Districts/Cities: POST to countriesnow with country name + state name ─
  // countriesnow /state/cities endpoint needs: { country: "India", state: "Tamil Nadu" }
  const fetchDistricts = (countryName: string, stateName: string) => {
    if (!countryName || !stateName) { setDistricts([]); return }

    setLoadingDistricts(true)
    setDistricts([]) // clear previous

    axios.post(CITIES_URL, { country: countryName, state: stateName })
      .then(res => {
        const list: string[] = res.data?.data ?? []
        setDistricts(
          list
            .map(city => ({ label: city, value: city }))
            .sort((a, b) => a.label.localeCompare(b.label)) // A-Z
        )
      })
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false))
  }

  const resetStates    = () => { setStates([]);    setDistricts([]) }
  const resetDistricts = () =>   setDistricts([])

  return {
    countries, states, districts,
    loadingCountries, loadingStates, loadingDistricts,
    fetchStates, fetchDistricts,
    resetStates, resetDistricts,
  }
}