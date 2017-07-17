const filters = [
  {
    "id": "price",
    "label": "Price",
    "size": 30,
    "type": "integer"
  },
  {
    "id": "date",
    "label": "Date",
    "type": "date",
    "size": 30
  },
  {
    "id": "rate",
    "label": "Rate",
    "type": "double",
    "size": 30
  },
  {
    "id": "ticket",
    "label": "Ticket",
    "type": "string",
    "size": 30
  },
  {
    "id": "movie",
    "label": "Movie",
    "type": "string",
    "size": 30
  },
  {
    "id": "boxOffice",
    "label": "Box Office",
    "type": "boolean",
    "size": 30
  },
  {
    "id": "reservationNum",
    "label": "Reservation Number",
    "type": "integer",
    "size": 30
  },
  {
    "id": "promotionCode",
    "label": "Promotion Code",
    "type": "double",
    "size": 30
  },
  {
    "id": "language",
    "label": "Language",
    "type": "string",
    "size": 30
  },
  {
    "id": "userType",
    "label": "User type",
    "type": "boolean",
    "input": "select",
    "size": 30,
    "values": [
      {
        "basic": "Basic User"
      },
      { "vip": "Vip" }
    ]
  },
  {
    "id": "review",
    "label": "Review",
    "type": "string",
    "size": 30,
    "input": "textarea"
  }
];

export { filters };