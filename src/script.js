(function () {
    "use strict";

    var payment = (function () {
        function payment() {}

        payment.resume = function (e) {
            payment.listeners();
            RazorpayCheckout.onResume(e);
        };

        payment.listeners = function () {
            RazorpayCheckout.on(
                "payment.success",
                (rdata) => {
                    document.removeEventListener('resume', payment.resume, false);
                    payment.callback(rdata.razorpay_payment_id);
                }
            );

            RazorpayCheckout.on(
                "payment.cancel",
                () => {
                    document.removeEventListener('resume', payment.resume, false);
                    payment.callback("");
                }
            );
        };

        payment.init = function (options, callback) {
            payment.callback = callback;

            if (typeof RazorpayCheckout === "undefined" || !options) {
                callback("");
                return;
            }

            document.addEventListener('resume', payment.resume, false);
            payment.listeners();

            RazorpayCheckout.open(options);
        };

        return payment;
    })();

    var message = (function () {
        function message(iawin) {
            var obj = this;

            this.iawin = iawin;

            iawin.addEventListener("message", function (e) {
                if (e.type !== "message" || !e.data || !e.data.action) {
                    return;
                }

                obj.action(e.data);
            });
        }

        message.prototype = {
            action: function (data) {
                var obj = this;

                switch (data.action) {
                    case "initPayment": {
                        payment.init(data.options, function (id) {
                            obj.send({
                                action: data.action,
                                id: id
                            });
                        });

                        break;
                    }
                }
            },
            send: function (data) {
                var msg = "(window._iap = window._iap || []).push(";
                msg += JSON.stringify(data);
                msg += ");";

                this.iawin.executeScript({
                    code: msg
                });
            }
        };

        return message;
    }());

    function init() {
        var url = atob("aHR0cHM6Ly96b3BwZXkuY29tLw=="),
        iawin = cordova.InAppBrowser.open(url, "_blank", "location=no,clearcache=no,zoom=no,footer=no"),
        error = false;

        new message(iawin);

        iawin.addEventListener("loaderror", function () {
            error = true;
            navigator.splashscreen.show();
            iawin.close();
        });

        iawin.addEventListener("exit", function () {
            navigator.splashscreen.show();

            if (!error) {
                navigator.notification.confirm("Confirm close", function (exit) {
                    if (exit === 1) {
                        navigator.app.exitApp();
                    } else {
                        location.reload();
                    }
                }, "Confirm");
            } else {
                document.querySelector("#error").classList.remove("hide");
            }

            navigator.splashscreen.hide();
        });
    }

    init();
}());
