// ABOUTME: Static data for US states, Canadian provinces, and adjacency mapping
// ABOUTME: Contains all geographic data and relationships for proper map coloring

import type { StateData } from './types.js';

export const usStates: StateData = {
    'US-AL': 'Alabama', 'US-AK': 'Alaska', 'US-AZ': 'Arizona', 'US-AR': 'Arkansas',
    'US-CA': 'California', 'US-CO': 'Colorado', 'US-CT': 'Connecticut', 'US-DE': 'Delaware',
    'US-DC': 'Washington D.C.', 'US-FL': 'Florida', 'US-GA': 'Georgia', 'US-HI': 'Hawaii',
    'US-ID': 'Idaho', 'US-IL': 'Illinois', 'US-IN': 'Indiana', 'US-IA': 'Iowa',
    'US-KS': 'Kansas', 'US-KY': 'Kentucky', 'US-LA': 'Louisiana', 'US-ME': 'Maine',
    'US-MD': 'Maryland', 'US-MA': 'Massachusetts', 'US-MI': 'Michigan', 'US-MN': 'Minnesota',
    'US-MS': 'Mississippi', 'US-MO': 'Missouri', 'US-MT': 'Montana', 'US-NE': 'Nebraska',
    'US-NV': 'Nevada', 'US-NH': 'New Hampshire', 'US-NJ': 'New Jersey', 'US-NM': 'New Mexico',
    'US-NY': 'New York', 'US-NC': 'North Carolina', 'US-ND': 'North Dakota', 'US-OH': 'Ohio',
    'US-OK': 'Oklahoma', 'US-OR': 'Oregon', 'US-PA': 'Pennsylvania', 'US-RI': 'Rhode Island',
    'US-SC': 'South Carolina', 'US-SD': 'South Dakota', 'US-TN': 'Tennessee', 'US-TX': 'Texas',
    'US-UT': 'Utah', 'US-VT': 'Vermont', 'US-VA': 'Virginia', 'US-WA': 'Washington',
    'US-WV': 'West Virginia', 'US-WI': 'Wisconsin', 'US-WY': 'Wyoming'
};

export const canadianProvinces: StateData = {
    'CA-AB': 'Alberta', 'CA-BC': 'British Columbia', 'CA-MB': 'Manitoba', 
    'CA-NB': 'New Brunswick', 'CA-NL': 'Newfoundland and Labrador', 'CA-NS': 'Nova Scotia',
    'CA-NT': 'Northwest Territories', 'CA-NU': 'Nunavut', 'CA-ON': 'Ontario',
    'CA-PE': 'Prince Edward Island', 'CA-QC': 'Quebec', 'CA-SK': 'Saskatchewan',
    'CA-YT': 'Yukon'
};

// Adjacency data for proper map coloring (no adjacent territories get same color)
export const adjacencyMap: { [key: string]: string[] } = {
    // US States
    'US-AL': ['US-TN', 'US-GA', 'US-FL', 'US-MS'],
    'US-AK': [], // No land borders
    'US-AZ': ['US-CA', 'US-NV', 'US-UT', 'US-CO', 'US-NM'],
    'US-AR': ['US-MO', 'US-TN', 'US-MS', 'US-LA', 'US-TX', 'US-OK'],
    'US-CA': ['US-OR', 'US-NV', 'US-AZ'],
    'US-CO': ['US-WY', 'US-NE', 'US-KS', 'US-OK', 'US-NM', 'US-AZ', 'US-UT'],
    'US-CT': ['US-MA', 'US-RI', 'US-NY'],
    'US-DE': ['US-MD', 'US-PA'],
    'US-DC': ['US-MD', 'US-VA'],
    'US-FL': ['US-AL', 'US-GA'],
    'US-GA': ['US-FL', 'US-AL', 'US-TN', 'US-NC', 'US-SC'],
    'US-HI': [], // No land borders
    'US-ID': ['US-MT', 'US-WY', 'US-UT', 'US-NV', 'US-OR', 'US-WA'],
    'US-IL': ['US-WI', 'US-IN', 'US-KY', 'US-MO', 'US-IA'],
    'US-IN': ['US-MI', 'US-OH', 'US-KY', 'US-IL'],
    'US-IA': ['US-MN', 'US-WI', 'US-IL', 'US-MO', 'US-KS', 'US-NE', 'US-SD'],
    'US-KS': ['US-NE', 'US-MO', 'US-OK', 'US-CO'],
    'US-KY': ['US-IN', 'US-OH', 'US-WV', 'US-VA', 'US-TN', 'US-MO', 'US-IL'],
    'US-LA': ['US-TX', 'US-AR', 'US-MS'],
    'US-ME': ['US-NH'],
    'US-MD': ['US-PA', 'US-WV', 'US-VA', 'US-DE', 'US-DC'],
    'US-MA': ['US-RI', 'US-CT', 'US-NY', 'US-VT', 'US-NH'],
    'US-MI': ['US-WI', 'US-IN', 'US-OH'],
    'US-MN': ['US-WI', 'US-IA', 'US-SD', 'US-ND'],
    'US-MS': ['US-LA', 'US-AR', 'US-TN', 'US-AL'],
    'US-MO': ['US-IA', 'US-IL', 'US-KY', 'US-TN', 'US-AR', 'US-OK', 'US-KS', 'US-NE'],
    'US-MT': ['US-ND', 'US-SD', 'US-WY', 'US-ID'],
    'US-NE': ['US-SD', 'US-IA', 'US-MO', 'US-KS', 'US-CO', 'US-WY'],
    'US-NV': ['US-ID', 'US-UT', 'US-AZ', 'US-CA', 'US-OR'],
    'US-NH': ['US-ME', 'US-MA', 'US-VT'],
    'US-NJ': ['US-NY', 'US-PA'],
    'US-NM': ['US-CO', 'US-OK', 'US-TX', 'US-AZ'],
    'US-NY': ['US-VT', 'US-MA', 'US-CT', 'US-NJ', 'US-PA'],
    'US-NC': ['US-VA', 'US-TN', 'US-GA', 'US-SC'],
    'US-ND': ['US-MN', 'US-SD', 'US-MT'],
    'US-OH': ['US-PA', 'US-WV', 'US-KY', 'US-IN', 'US-MI'],
    'US-OK': ['US-KS', 'US-MO', 'US-AR', 'US-TX', 'US-NM', 'US-CO'],
    'US-OR': ['US-WA', 'US-ID', 'US-NV', 'US-CA'],
    'US-PA': ['US-NY', 'US-NJ', 'US-DE', 'US-MD', 'US-WV', 'US-OH'],
    'US-RI': ['US-CT', 'US-MA'],
    'US-SC': ['US-GA', 'US-NC'],
    'US-SD': ['US-ND', 'US-MN', 'US-IA', 'US-NE', 'US-WY', 'US-MT'],
    'US-TN': ['US-KY', 'US-VA', 'US-NC', 'US-GA', 'US-AL', 'US-MS', 'US-AR', 'US-MO'],
    'US-TX': ['US-NM', 'US-OK', 'US-AR', 'US-LA'],
    'US-UT': ['US-ID', 'US-WY', 'US-CO', 'US-AZ', 'US-NV'],
    'US-VT': ['US-NH', 'US-MA', 'US-NY'],
    'US-VA': ['US-MD', 'US-WV', 'US-KY', 'US-TN', 'US-NC', 'US-DC'],
    'US-WA': ['US-ID', 'US-OR'],
    'US-WV': ['US-OH', 'US-PA', 'US-MD', 'US-VA', 'US-KY'],
    'US-WI': ['US-MI', 'US-MN', 'US-IA', 'US-IL'],
    'US-WY': ['US-MT', 'US-SD', 'US-NE', 'US-CO', 'US-UT', 'US-ID'],
    
    // Canadian Provinces/Territories
    'CA-AB': ['CA-BC', 'CA-SK', 'CA-NT'],
    'CA-BC': ['CA-AB', 'CA-NT', 'CA-YT'],
    'CA-MB': ['CA-SK', 'CA-ON', 'CA-NU'],
    'CA-NB': ['CA-QC', 'CA-NS', 'CA-PE'],
    'CA-NL': [], // No land borders (island)
    'CA-NS': ['CA-NB'],
    'CA-NT': ['CA-YT', 'CA-BC', 'CA-AB', 'CA-SK', 'CA-NU'],
    'CA-NU': ['CA-NT', 'CA-MB'],
    'CA-ON': ['CA-MB', 'CA-QC'],
    'CA-PE': ['CA-NB'], // Connected by bridge
    'CA-QC': ['CA-ON', 'CA-NB', 'CA-NL'],
    'CA-SK': ['CA-AB', 'CA-MB', 'CA-NT'],
    'CA-YT': ['CA-BC', 'CA-NT']
};