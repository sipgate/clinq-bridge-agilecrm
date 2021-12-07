# CLINQ-Bridge for AgileCRM

This service provides AgileCRM contacts for CLINQ.

The AgileCRM API is described [https://github.com/agilecrm/rest-api](https://github.com/agilecrm/rest-api) 

To run the integration you need a API Key. Get it from the AgileCRM Site: "Admin Settings" -> "Developers & API"

For local development the API Key and API URL must be provided as Header:
* "x-provider-key" is the Header for the API Key 
* "x-provider-url" is the Header for the API URL

This urls can be useful in local development.

* GET http://localhost:8080/contacts 
  * trigger fetching contacts from AgileCRM
* POST http://localhost:8080/events/calls 
  * trigger handling phone calls event, see example payload in callEvent.json
* POST http://localhost:8080/contacts
  * trigger creating contact
* PUT http://localhost:8080/contacts
  * trigger updating contact 
* DELETE http://localhost:8080/contacts
  * trigger deleting contact



