
import { ApolloClient, InMemoryCache } from '@apollo/client';

// Create a client for The Graph API
export const client = new ApolloClient({
  uri: ' https://api.studio.thegraph.com/query/107809/paperregistryadvancedmultiauditorplus/v0.0.1', 
  cache: new InMemoryCache(),
});
