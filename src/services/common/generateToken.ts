import jwt from "jsonwebtoken";

const payload = {
    clientId:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJkb3NoaWkiLCJzdWIiOnsiZm9yIjoiQXBwQ2xpZW50SWQiLCJpZCI6bnVsbH0sImV4cCI6MTc3MTA3MjMyNX0.57mYqHX-oMsrpojjY-CAIa-RIJcnl7enODu2kS2OCCU",
    timestamp: new Date(),
};

const clientSecret =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJkb3NoaWkiLCJzdWIiOnsiZm9yIjoiQXBwQ2xpZW50U2VjcmV0IiwiaWQiOm51bGx9LCJleHAiOjE3NzEwNzIzMjV9.IQJQ2ONmBzC3ol5lgQhUAEYOfvd0DiBhLtTJzGga2aE";

const token = jwt.sign(payload, clientSecret);

console.log(token);

export { token };
