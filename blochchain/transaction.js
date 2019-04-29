
class Transaction {

  constructor(from, fromEmail, to, toEmail, requestData, ip ) {
    this.from = from
    this.fromEmail = fromEmail
    this.to = to
    this.toEmail = toEmail
    this.requestData = requestData
    this.ip = ip  
}

}

module.exports = Transaction
