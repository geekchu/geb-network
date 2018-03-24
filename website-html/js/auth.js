

(function(window) {

    var ShiftCash = window.ShiftCash = window.ShiftCash || {};

})(window);

(function(window, $, ko, _, ShiftCash) {

    function koAjax(options) {

        var pending = ko.observable(false);

        var fun = function(data) {

            if (pending()) {
                console.log('pending()');
                return $.Deferred();
            }
            pending(true);

            var params = _.extend({}, options, {
                data: data,
                headers: options.headers ? options.headers() : {}
            });

            return $.ajax(params)
                .always(function() {
                    console.log('unlock');
                    pending(false);

                });

        };
        fun.pending = pending;
        return fun;
    }

    ShiftCash.API = new function Api() {

        var api = this;

        var accessToken = null;

        var endpoint = "https://shift.cash/api";
        var routes = _({
            captcha: "/user/captcha",
            signup: "/user/register",
            login: "/user/login",
            reset: "/user/reset",
            logout: "/user/logout",
            balance: "/profile/balances",
            ethBalance: "/stat/balance/",
            wallet: "/profile/wallet",
            passwd: "/profile/password",
            name: "/profile/name",
            last_name: "/profile/last_name",
            country: "/profile/country",
            profile: "/profile",
            stats: "/stat",
            subscribe: "/subscribe",
            referrals: "/profile/referrals",
            transactions: "/profile/transactions",
            ref_transactions: "/profile/ref_transactions"
        })
            .each(function(v, k, l) {
                l[ k ] = endpoint + v;
            });

        api.routes = routes;

        api.setToken = function(token) {
            accessToken = token;
            localStorage.setItem('access-token', accessToken);
            var cookieExpire = (new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)).toUTCString();
            document.cookie = 'accessToken=' + accessToken +
                              "; expires=" + cookieExpire +
                              "; path=/";
        };

        api.deleteToken = function() {
            accessToken = null;
            localStorage.removeItem('access-token');
            var cookieExpire = "Thu, 01 Jan 1970 00:00:00 UTC";
            document.cookie = 'accessToken=' +
                              "; expires=" + cookieExpire +
                              "; path=/";
        };

        api.getHeaders = function() {
            return { token: accessToken }
        };

        api.subscribe = koAjax({
            method: "POST",
            url: api.routes.subscribe,
            data: { /* email */ }
        });

        api.getCaptcha = koAjax({
            method: "GET",
            url: api.routes.captcha,
            dataType: "text"
        });

        api.signup = koAjax({
            method: "POST",
            url: api.routes.signup,
            data: { /* email, captcha*/ }
        });

        api.reset = koAjax({
            method: "POST",
            url: api.routes.reset,
            data: { /* email, captcha*/ }
        });

        api.login = koAjax({
            method: "POST",
            url: api.routes.login,
            data: { /* email, password */ }
        });

        api.getProfile = koAjax({
            method: "GET",
            url: api.routes.profile,
            headers: api.getHeaders
        });

        api.getStats = koAjax({
            method: "GET",
            url: api.routes.stats
        });

        api.getBalance = koAjax({
            method: "GET",
            url: api.routes.balance,
            headers: api.getHeaders
        });
 
        api.getRefs = koAjax({
            method: "GET",
            url: api.routes.referrals,
            headers: api.getHeaders
        });

        api.getTransactions = koAjax({
            method: "GET",
            url: api.routes.transactions,
            headers: api.getHeaders
        });

        api.getRefTransactions = koAjax({
            method: "GET",
            url: api.routes.ref_transactions,
            headers: api.getHeaders
        });

        api.changePassword = koAjax({
            method: "PUT",
            url: api.routes.passwd,
            data: { /* new_password, old_password */ },
            headers: api.getHeaders
        });

        api.setEthereumWallet = koAjax({
            method: "PUT",
            url: api.routes.wallet,
            data: { /* wallet: address */ },
            headers: api.getHeaders
        });

        api.changeName = koAjax({
            method: "PUT",
            url: api.routes.name,
            data: { /* name */ },
            headers: api.getHeaders
        });
        api.changeLastName = koAjax({
            method: "PUT",
            url: api.routes.last_name,
            data: { /* last_name */ },
            headers: api.getHeaders
        });
        api.changeCountry = koAjax({
            method: "PUT",
            url: api.routes.country,
            data: { /* country */ },
            headers: api.getHeaders
        });

        api.logout = function() {
            api.deleteToken();
            location.href = "/auth?login";
        };

        api.getEthBalance = function(wallet) {
            return koAjax({
                method: 'GET',
                url: api.routes.ethBalance + wallet,
                data: {}
            })();
        };

    };

    function apiWrapper(apiCall, params, headers) {
        var api = ShiftCash.API;
        return function() {
            console.log('wrapper');

            var Result = $.Deferred();

            if (headers && !api.getHeaders().token) {
                failure();
                return Result.promise();
            }

            var query = {};
            for (var i = 0; i < params.length; i++) {
                if (arguments[ i ] !== undefined) {
                    query[ params[ i ] ] = arguments[ i ];
                }
            }

            apiCall(query)
                .done(done)
                .fail(failure);

            return Result.promise();

            function done(resp) {
                if (resp.success) {
                    return success(resp);
                }
                else {
                    return failure(resp);
                }
            }

            function success(resp) {
                Result.resolve(resp);
            }

            function failure(resp) {
                Result.reject(resp);
            }
        }
    }

    ShiftCash.Account = new function Account() {

        var api = ShiftCash.API;

        this.getCaptcha = function() {
            return api.getCaptcha();
        };

        this.signup = apiWrapper(api.signup, [ 'email', 'captcha' ], false);
        this.reset = apiWrapper(api.reset, [ 'email', 'captcha' ], false);
        this.login = apiWrapper(api.login, [ 'login', 'password' ], false);
        this.logout = function() {
            return api.logout();
        };
        this.getProfile = apiWrapper(api.getProfile, [], true);

        this.getRefs = apiWrapper(api.getRefs, [], true);
        this.getTransactions = apiWrapper(api.getTransactions, [], true);
        this.getRefTransactions = apiWrapper(api.getRefTransactions, [], true);
        
        this.getStats = function() {
            return api.getStats();
        };
        this.getBalance = apiWrapper(api.getBalance, [], true);
        this.getEthBalance = function(wallet) {
            return api.getEthBalance(wallet);
        };
        this.changePassword = apiWrapper(api.changePassword, [ 'old_password', 'new_password' ], true);
        this.changeName = apiWrapper(api.changeName, [ 'name' ], true);
        this.changeLastName = apiWrapper(api.changeLastName, [ 'last_name' ], true);
        this.changeCountry = apiWrapper(api.changeCountry, [ 'country' ], true);
        this.setEthereumWallet = apiWrapper(api.setEthereumWallet, [ 'wallet' ], true);

    };

    ShiftCash.Subscription = new function Subscription() {

        this.subscribe = subscribe;
        this.unsubscribe = unsubscribe;
        this.isSubscribed = isSubscribed;

        function isSubscribed() {
            return localStorage.getItem('subscribed')
        }

        function subscribe(email) {
            var result = $.Deferred();
            if (!email) return result.reject();

            ShiftCash.API.subscribe({ email: email })
                .done(done)
                .fail(failure);

            return result;

            function done(resp) {
                if (resp.success) {
                    return success(resp);
                } else {
                    return failure(resp);
                }
            }

            function success(resp) {
                localStorage.setItem('subscribed', true);
                result.resolve(resp);

                dataLayer.push({ 'event': 'send_form_subscribe' });
                yaCounter46295010.reachGoal('ym_send_form_subscribe');
                fbq('track', 'fb_send_form_subscribe');
            }

            function failure(resp) {
                if (resp && resp.error === "already_subscribed") {
                    success(resp);
                } else {
                    result.reject(resp);
                }
            }
        }

        function unsubscribe() {
            localStorage.removeItem('subscribed');
        }

    };

    var viewModel =
        ShiftCash.ViewModel = new function() {

            var vm = this;

            var Alert = function(msg, title, callback) {
                title = title || "";
                showModal(title, msg, callback);
            };

            var account = ShiftCash.Account,
                api = ShiftCash.API;

            var logged =
                this.logged = ko.observable(false);

            var authForm =
                this.authForm = {
                    'email': ko.observable(''),
                    'captcha': ko.observable(''),
                    'captchaImg': ko.observable(''),
                    'password': ko.observable(''),
                    'agree': ko.observable(true),
                };

            var userProfile =
                this.userProfile = {
                    'login': ko.observable(''),
                    'name': ko.observable(''),
                    'tokens': ko.observable(0),
                    'btc_wallet': ko.observable(''),
                    'btc_balance': ko.observable(0),
                    'ltc_wallet': ko.observable(''),
                    'ltc_balance': ko.observable(0),
                    'user_eth_wallet': ko.observable(''),
                    'referral_url': ko.observable(''),

                    'last_name': ko.observable(''),
                    'country': ko.observable(''),
                    load: loadProfile
                };


            var profileForm =
                this.profileForm = {
                    'name': ko.observable(''),
                    'email': ko.observable(''),
                    'last_name': ko.observable(''),
                    'country_name': ko.observable(countrySelectText),
                    'country': ko.observable('')
                };

            var passwdForm =
                this.passwdForm = {
                    'oldPass': ko.observable(''),
                    'newPass': ko.observable(''),
                    'repeatPass': ko.observable('')
                };

            var ethWalletForm =
                this.ethWalletForm = {
                    'user_eth_wallet': ko.observable('')
                };


            this.subscribed = ko.observable(ShiftCash.Subscription.isSubscribed());

            var subscribeForm =
                this.subscribeForm = {
                    'email': ko.observable(''),
                    'text': ko.computed(function() {

                    }),
                    'css': ko.computed(function() {
                        if (vm.subscribed()) {
                            return 'form-subscribed';
                        } else {
                            return '';
                        }
                    }),
                };

            this.subscribeClick = subscribeClick;

            var formError =
                this.formError = {
                    'name': ko.observable(false),
                    'eth_wallet': ko.observable(false),
                    'old_pass': ko.observable(false),
                    'new_pass': ko.observable(false),
                    'repeat_pass': ko.observable(false),

                    'old_pass_error': ko.observable(''),
                    'new_pass_error': ko.observable(''),
                    'repeat_pass_error': ko.observable(''),

                    'reg_email': ko.observable(false),
                    'reg_captcha': ko.observable(false),
                    'reg_agree': ko.observable(false),

                    'reset_email': ko.observable(false),
                    'reset_captcha': ko.observable(false),

                    'login_email': ko.observable(false),
                    'login_pass': ko.observable(false),


                    'subscribe_email': ko.observable(false),

                    'last_name': ko.observable(false),
                    'country': ko.observable(false),
                };

            var events = new function() {
                profileForm.name.subscribe(function(value) {
                    formError.name(false);
                });
                profileForm.last_name.subscribe(function(value) {
                    formError.last_name(false);
                });
                ethWalletForm.user_eth_wallet.subscribe(function(value) {
                    formError.eth_wallet(false);
                });

                passwdForm.oldPass.subscribe(function(v) {
                    formError.old_pass(false);
                });
                passwdForm.newPass.subscribe(function(v) {
                    formError.new_pass(false);
                    formError.repeat_pass(false);
                });
                passwdForm.repeatPass.subscribe(function(v) {
                    formError.new_pass(false);
                    formError.repeat_pass(false);
                });

                authForm.email.subscribe(function(v) {
                    formError.reg_email(false);
                    formError.login_email(false);
                    formError.reset_email(false);
                });
                authForm.captcha.subscribe(function(v) {
                    formError.reg_captcha(false);
                    formError.reset_captcha(false);
                });
                authForm.password.subscribe(function(v) {
                    formError.login_pass(false);
                });

                subscribeForm.email.subscribe(function(v) {
                    formError.subscribe_email(false);
                });
                profileForm.country.subscribe(function(v) {
                    formError.country(false);
                    changeSelectedCountry(profileForm.country());  
                    if(profileForm.country() == 'us' || profileForm.country() == 'cn' || profileForm.country() == 'sg'){
                        vm.visible.passData(true);
                    }else {
                        vm.visible.passData(false);
                    }
                });
            };


            this.visible = new function() {
                this.profile = ko.observable(false);
                this.contribute = ko.observable(false);
                this.loader = ko.observable(true);
                this.changePasswd = ko.observable(false);
                this.passData = ko.observable(false);
                this.payment = ko.observable(false);
                this.etherscan = ko.observable(false);
                this.history = ko.observable(false);
            };

            this.enabled = new function() {

                /*
                this.getCaptcha = ko.computed(function() {
                    return !api.getCaptcha.pending();
                });
                */

                this.saveChanges = ko.computed(function() {
                    var formTouched = vm.userProfile.name() !== vm.profileForm.name() ||
                                      vm.userProfile.user_eth_wallet() !== vm.ethWalletForm.user_eth_wallet() ||
                                      vm.userProfile.last_name() !== vm.profileForm.last_name() ||
                                      vm.userProfile.country() !== vm.profileForm.country();

                    var formValid = vm.profileForm.name().length > 0 &&
                                    vm.ethWalletForm.user_eth_wallet().length > 0 &&
                                    vm.profileForm.last_name().length > 0 &&
                                    vm.profileForm.country().length > 0;

                    var formPending = api.changeName.pending() || api.setEthereumWallet.pending() || api.changeLastName.pending() || api.changeCountry.pending();

                    return formTouched /*&& formValid*/ && !formPending;
                });

                this.changePasswd = ko.computed(function() {
                    var formValid = vm.passwdForm.oldPass().length > 0 &&
                                    vm.passwdForm.newPass().length > 0 &&
                                    vm.passwdForm.repeatPass().length > 0;

                    var formPending = api.changePassword.pending();

                    return formValid && !formPending;
                });
                this.getWallet = ko.observable(false);
            };

            this.signUpClick = signUpClick;
            this.resetClick = resetClick;
            this.logInClick = logInClick;
            this.showChangePasswd = showChangePasswd;
            this.hideChangePasswd = hideChangePasswd;
            this.changePasswdClick = changePasswdClick;
            this.saveChangesClick = saveChangesClick;
            this.getCaptcha = getCaptcha;

            this.confirmPayment = confirmPayment;

            this.layout = new function() {
                this.showProfile = function() {
                    vm.visible.profile(true);
                    vm.visible.contribute(false);
                    vm.visible.history(false);
                };
                this.showContribute = function() {
                    vm.visible.profile(false);
                    vm.visible.contribute(true);
                    vm.visible.history(false);
                };
                this.showHistory = function() {
                    vm.visible.profile(false);
                    vm.visible.contribute(false);
                    vm.visible.history(true);
                    fetchHistory();
                }
            };

            this.menu = new function() {
                this.profileClick = function() {
                    vm.layout.showProfile();
                };
                this.contributeClick = function() {
                    vm.layout.showContribute();
                };
                this.historyClick = function() {
                    vm.layout.showHistory();
                };
            };

            this.checkEthBalance = checkEthBalance;
            this.checkBalance = checkBalance;
            this.refreshBalance = refreshBalance;
            this.onDashboardLoad = onDashboardLoad;
            this.refreshBalanceSpiner = ko.observable(false);

            var transactions = self.transactions = ko.observableArray([]);
            var referrals = self.referrals = ko.observableArray([]);
            var refTransactions = self.refTransactions = ko.observableArray([]);
            
            function fetchHistory() {
                var refs = account.getRefs(),
                    txs = account.getTransactions(),
                    refTxs = account.getRefTransactions();
                $.when(refs, txs, refTxs).done(function(refResp, txsResp, refTxsResp) {
                    console.log(refResp, txsResp, refTxsResp);


                    transactions(txsResp.items);
                    refTransactions(refTxsResp.items);
                })
            }



            function onDashboardLoad() {
                isLogged()
                    .then(function() {
                        userProfile.load();
                        vm.layout.showContribute();
                    }, function() {
                        account.logout()
                    });
            }

            function isLogged() {
                return account.getProfile()
                    .done(success)
                    .fail(failure);

                function success() {
                    logged(true);
                }

                function failure() {
                    logged(false);
                }
            }

            function showChangePasswd() {
                vm.visible.changePasswd(true);
            }

            function hideChangePasswd() {
                vm.passwdForm.oldPass("");
                vm.passwdForm.newPass("");
                vm.passwdForm.repeatPass("");
                vm.visible.changePasswd(false);
            }

            function saveChangesClick() {
                formError.name(false);
                formError.eth_wallet(false);
                formError.last_name(false);
                formError.country(false);

                var newName = profileForm.name();
                var saveName = userProfile.name() !== newName;

                var newEth = ethWalletForm.user_eth_wallet();
                var saveEthWallet = userProfile.user_eth_wallet() !== newEth;

                var newLastName = profileForm.last_name();
                var saveLastName = userProfile.last_name() !== newLastName;

                var newCountry = profileForm.country();
                var saveCountry = userProfile.country() !== newCountry;

                if (saveName && (newName === "")) {
                    formError.name(true);
                    return;
                }

                if (saveEthWallet && (newEth === "")) {
                    formError.eth_wallet(true);
                    return;
                }

                if (saveLastName && (newLastName === "")) {
                    formError.last_name(true);
                    return;
                }

                if (saveCountry && (newCountry === "")) {
                    formError.country(true);
                    return;
                }

                var d1, d2, d3, d4;

                if (saveName) {
                    d1 = account.changeName(newName)
                        .done(function() {
                            userProfile.name(newName);
                        })
                        .fail(function() {
                            formError.name(true);
                        });
                }

                if (saveEthWallet) {
                    d2 = account.setEthereumWallet(newEth)
                        .done(function() {
                            userProfile.user_eth_wallet(newEth);
                            ga('send', 'event', 'UserData', 'addEthWallet', { 'dimension2': newEth, 'metric3': 1});
                        })
                        .fail(function() {
                            formError.eth_wallet(true);
                        });
                }

                if (saveLastName) {
                    d3 = account.changeLastName(newLastName)
                        .done(function() {
                            userProfile.last_name(newLastName);
                        })
                        .fail(function() {
                            formError.last_name(true);
                        });
                }

                if (saveCountry) {
                    d4 = account.changeCountry(newCountry)
                        .done(function() {
                            userProfile.country(newCountry);
                        })
                        .fail(function() {
                            formError.country(true);
                        });
                }

                $.when(d1, d2, d3, d4)
                    .done(function() {
                        Alert(__('all_saved'));
                    });


            }

            window.onSignUpToken = function(token) {
                authForm.captcha(token);
                signUpClick();
            };

            window.onResetToken = function(token) {
                authForm.captcha(token);
            };

            function checkEthBalance() {
                account.getEthBalance(vm.userProfile.user_eth_wallet()).done(function(resp) {
                    if (resp && resp.balance !== undefined)
                        Alert("You have " + resp.balance + " SCASH on this wallet", "Balance");
                });
            }

            function checkBalance() {
                account.getBalance().done(function(resp) {
                    console.log(resp);
                    userProfile.tokens(resp.tokens);
                });
            }
            function refreshBalance(){
                vm.refreshBalanceSpiner(true);
                setTimeout(function(){
                    checkBalance();
                    vm.refreshBalanceSpiner(false);
                }, 1000);
                
            }
            function confirmPayment() {
                dataLayer.push({'event': 'successful_purchase'});
                yaCounter46295010.reachGoal('ya_successful_purchase');
                fbq('track', 'fb_successful_purchase');
                return checkBalance();
            }

            function signUpClick() {
                if (authForm.agree()) {
                    formError.reg_agree(false);
                }else{
                    formError.reg_agree(true);
                    return;
                } 

                account.signup(authForm.email(), authForm.captcha())
                    .done(success)
                    .fail(failure);

                function success(resp) {
                    dataLayer.push({'event': 'register_complete'});
                    yaCounter46295010.reachGoal('ya_register_complete');
                    fbq('track', 'fb_register_complete');

                    ga('set', 'metric1', 1);
                    ga('send', 'event', 'Register', 'SuccessRegister');
                    yaCounter46295010.reachGoal('ya_SuccessRegister');

                    Alert(__("register_completed"), null, function() {
                        location.href = "/auth?login";
                    });
                }

                function failure(resp) {
                    grecaptcha.reset();
                    if (resp.error) {
                        switch (resp.error) {
                            case 'invalid_email':
                                formError.reg_email(true);
                                break;
                            case 'invalid_captcha':
                                formError.reg_captcha(true);
                                //getCaptcha();
                                break;
                            case 'user_exists':
                                Alert(__("reg_user_exists"));
                        }
                    }
                }
            }

            function resetClick() {
                if (!authForm.email() || !authForm.captcha()) return;

                account.reset(authForm.email(), authForm.captcha())
                    .done(success)
                    .fail(failure);

                function success(resp) {
                    Alert(__("pass_reset"), null, function() {
                        location.href = "/auth?login";
                    });
                }

                function failure(resp) {
                    grecaptcha.reset();
                    if (resp.error) {
                        switch (resp.error) {
                            case 'invalid_email':
                                formError.reset_email(true);
                                break;
                            case 'user_not_exist':
                                formError.reset_email(true);
                                break;
                            case 'invalid_captcha':
                                formError.reset_captcha(true);
                                //getCaptcha();
                                break;
                        }
                    }
                }
            }

            function logInClick() {
                account.login(authForm.email(), authForm.password())
                    .done(success)
                    .fail(failure);

                function success(resp) {
                    // TODO: pick the right field
                    if (resp.first_login) {
                        ga('set', 'metric2', 1);
                        ga('send', 'event', 'Register', 'SuccessLogin');
                        yaCounter46295010.reachGoal('ya_SuccessLogin');
                    }
                    userProfile.login(resp.login);
                    api.setToken(resp.access_token);
                    location.href = "/dashboard";
                }

                function failure(resp) {
                    if (resp && resp.error) {
                        switch (resp.error) {
                            case 'need_login':
                            case 'wrong_login':
                                formError.login_email(true);
                                break;
                            case 'need_password':
                            case 'wrong_password':
                                formError.login_pass(true);
                                break;
                        }

                    }
                }
            }

            function getCaptcha() {
                account.getCaptcha()
                    .done(function(resp) {
                        authForm.captchaImg(resp);
                    });
            }

            function changePasswdClick() {
                formError.old_pass(false);
                formError.new_pass(false);
                formError.repeat_pass(false);

                formError.old_pass_error('');
                formError.new_pass_error('');
                formError.repeat_pass_error('');

                if (passwdForm.oldPass().length === 0) {
                    formError.old_pass(true);
                    return false;
                }
                if (passwdForm.newPass().length < 6) {
                    formError.new_pass(true);
                    formError.new_pass_error(__('short_password'));
                    return false;
                }
                if (passwdForm.newPass() !== passwdForm.repeatPass()) {
                    formError.new_pass(true);
                    formError.repeat_pass(true);
                    formError.repeat_pass_error(__('password_mismatch'));

                    return false;
                }
                account.changePassword(passwdForm.oldPass(), passwdForm.newPass())
                    .done(function() {
                        vm.hideChangePasswd();
                    })
                    .fail(function(resp) {
                        if (resp && resp.error) {
                            switch (resp.error) {
                                case 'need_old_password':
                                    formError.old_pass(true);
                                    //formError.old_pass_error(__(resp.error));
                                    break;
                                case 'need_new_password':
                                    formError.new_pass(true);
                                    formError.new_pass_error(__(resp.error));
                                    break;
                                case 'short_password':
                                    formError.new_pass(true);
                                    formError.new_pass_error(__(resp.error));
                                    break;
                                case 'wrong_old_password':
                                    formError.old_pass(true);
                                    formError.old_pass_error(__(resp.error));
                                    break;
                            }
                        }
                    });
            }

            function loadProfile() {
                console.log('load');
                var q = account.getProfile();
                console.log(q);
                q.done(function(resp) {
                        _.map(resp, function(v, k) {
                            userProfile[ k ] && userProfile[ k ](v);
                        });

                        profileForm.name(resp.name || '');
                        profileForm.email(resp.login);
                        profileForm.last_name(resp.last_name || '');
                        profileForm.country(resp.country || '');
                        ethWalletForm.user_eth_wallet(resp.user_eth_wallet || '');
                    })
                    .always(function() {
                        console.log('always');
                    });

                console.log(q);
                window.q = q;

            }

            function subscribeClick() {
                formError.subscribe_email(false);
                console.log('click');
                if (ShiftCash.Subscription.isSubscribed()) {
                    console.log('subscribed');
                    ShiftCash.Subscription.unsubscribe();
                    vm.subscribed(ShiftCash.Subscription.isSubscribed());
                    return;
                }
                console.log('subscribe...');
                ShiftCash.Subscription.subscribe(vm.subscribeForm.email())
                    .done(function() {
                        console.log('subscribed!');
                        console.log(ShiftCash.Subscription.isSubscribed());
                        vm.subscribed(ShiftCash.Subscription.isSubscribed());
                    })
                    .fail(function() {
                        formError.subscribe_email(true);
                    });
            }

            function changeSelectedCountry(code){
                var cn = $('.section-dashboard .country-select').find('[data-country='+ code +']').text();
                if(cn){
                    profileForm.country_name(cn);
                }
            }
            // Calculator
            var cryptoRate = this.cryptoRate = {};

            for (key in cryptoConv) {
                
                (function(k) {
                    cryptoRate[cryptoConv[k].short] = ko.observable(1);
                    $.get
                    (
                        'https://api.coinmarketcap.com/v1/ticker/ethereum/',
                        {convert: cryptoConv[k].short},
                        function(data)
                        {
                            
                            cryptoConv[k].rate = 450/data[0]['price_' + cryptoConv[k].short];
                            cryptoRate[cryptoConv[k].short](cryptoConv[k].rate);
                            if(k == 0){
                                rawRate(cryptoConv[k].rate);
                            }
                        },
                        'JSON'
                    );
                })(key);
                
            }
            
            //console.log(cryptoRate);
            var crypto2tokens = self.crypto2tokens = ko.observable(true);

            //console.log(initialRate);
            var rawRate = ko.observable();
            var rate = ko.computed({
                read: function() {
                    return rawRate();
                },
                write: function(val) {
                    if (crypto2tokens()) {
                        var cryptoAmount = crypto();
                        rawRate(+val);

                        crypto(cryptoAmount);
                    } else {
                        var tokenAmount = tokens();
                        rawRate(+val);
                        tokens(tokenAmount);
                    }
                }
            });
            var bonusRate = currentBonus;
            var tokensRaw = this.tokensRaw = ko.observable(0);
            var tokens = this.tokens = ko.computed({
                read: function() {
                    var result = tokensRaw();
                    if (isNaN(result)) return 0;
                    var ta = tokensRaw();
                    if(!crypto2tokens()){
                        return +ta;
                    }else {
                        return parseFloat(ta.toFixed(2));
                    }
                    //return +tokensRaw();
                },
                write: function(val) {
                    //console.log(typeof val);
                    if (typeof val === "string" && val.match(/[^0-9.]/g)) {
                        val = val.replace(/[^0-9.]/g, '');
                    }
                    tokensRaw(+val);
                }
            });

            var crypto = this.crypto = ko.computed({
                read: function() {
                    //console.log('read');
                    var tr = tokensRaw() / rate();
                    if(crypto2tokens()){
                        return +tr;
                    }else {
                        return parseFloat(tr.toFixed(4));
                    }
                    //return tokensRaw() / rate();
                },
                
                write: function(val) {
                    if (typeof val === "string" && val.match(/[^0-9.]/g)) {
                        val = val.replace(/[^0-9.]/g, '');
                    }
                    tokensRaw(+val * rate());
                }
            });
            var bonus = this.bonus = ko.computed(function() {
                var tb = tokens() * bonusRate / 100
                return parseFloat(tb.toFixed(2));
                
            }); // tokens
            var total = this.total = ko.computed(function() {
                var tt = tokens() + bonus();
                return parseFloat(tt.toFixed(2));
            });

            
            var swapCryptoTokens = this.swapCryptoTokens = function() {
                crypto2tokens(!crypto2tokens());
            };

            

            $(document).on('click', '.currency-menu a', function(e){
                e.preventDefault();
                rate($(this).data('rate'));
                
                $('#buttonCurrency').text($(this).text());
            });

            //contribute
            $(document).ready(fixHelper);
            $(window).scroll(fixHelper).resize(fixHelper);
            function fixHelper(){
                var helper = $('.helper-container');
                if($(window).scrollTop() > $('.navbar').outerHeight()){
                    var margin = $(window).scrollTop() - $('.navbar').outerHeight() + 79;
                    if($(helper).outerHeight() + margin <= $('.toFixHelp').outerHeight(true)){
                        $(helper).css({'margin-top': margin});
                    } else {
                        margin = $('.toFixHelp').outerHeight(true) - $(helper).innerHeight();
                        $(helper).css({'margin-top': margin});
                    }
                } else {
                    $(helper).removeAttr('style');
                }
            }
            $(document).on('click', '.section-dashboard button[data-scrollto]', function(e){
                destination = Math.max(0, $($(this).data('scrollto')).offset().top - $('.navbar').innerHeight() - $(window).innerHeight() / 8);
                if (isSafari()) {
                    $('body').animate({scrollTop: destination}, 1100, function(){switchTabs(e.target.className)});
                } else {
                    $('html').animate({scrollTop: destination}, 1100, function(){switchTabs(e.target.className)});
                }
            });
            function switchTabs(targetClass){
                if(targetClass == 'confirmation'){
                    if(outputCurrency() == 'eth'){
                        vm.layout.showProfile();
                    }else {
                        vm.layout.showHistory();
                    }
                }
            }
            function isSafari() {
                return navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
            }

            this.showPayment = showPayment;
            this.changeCurrency = changeCurrency;
            var outputCurrency = this.outputCurrency = ko.observable('');
            var outputCurrencyName = this.outputCurrencyName = ko.observable('');
            var walletData = this.walletData = {
                'wallet': ko.observable(''),
                'note': ko.observable(''),
                'qr': ko.observable('')
            };
           
            function showPayment() {
                if(outputCurrency() != ''){
                    vm.visible.payment(true);
                }
            }
            function changeCurrency(currency, name){
                return function() {
                    outputCurrencyName(name);
                    outputCurrency(currency);                  
                    vm.enabled.getWallet(true);
                    vm.walletData.note(confirmationNotes[currency]);
                }
            }
            var QR;
            outputCurrency.subscribe(function(val) {
                switch (val){
                    case 'btc':
                        vm.walletData.wallet(vm.userProfile.btc_wallet());
                        vm.visible.etherscan(false);
                        break;
                    case 'ltc':
                        vm.walletData.wallet(vm.userProfile.ltc_wallet());
                        vm.visible.etherscan(false);
                        break;
                    case 'eth':
                        vm.walletData.wallet('0x2eae96e6BF99565c9d8cE978b24c3fC3b552DC7B');
                        vm.visible.etherscan(true);
                        break;
                    default:
                        vm.walletData.wallet('');
                }
                if(!QR){
                    QR = new QRCode(document.getElementById("qr_code"), {
                        text: vm.walletData.wallet(),
                        width: 150,
                        height: 150,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.H
                    });
                } else {
                    QR.makeCode(vm.walletData.wallet());
                }
            });

        };

    ko.applyBindings(viewModel);

    $(document)
        .on('click', '.js-logout', function() {
            ShiftCash.Account.logout();
            return false;
        });

    $(function() {
        if (localStorage.getItem('access-token')) {
            ShiftCash.API.setToken(localStorage.getItem('access-token'));
        }
        if (location.pathname === "/dashboard") {
            viewModel.onDashboardLoad();
        }
    });
    new CustomClipboard('.js-copy-referral');
    new CustomClipboard('.js-copy-wallet');
    
    function CustomClipboard(sel) {
        var btn = $(sel);

        var customClipboard = new Clipboard(sel);
        customClipboard.on('success', function(e) {
            btn = $(sel);
            btn.tooltip({ title: "Copied!", trigger: "manual" });
            btn.tooltip('show');
            setTimeout(function() {
                btn.tooltip('hide');
            }, 1000);
        });

        customClipboard.on('error', function(e) {
            btn = $(sel);
            btn.tooltip({ title: "Press Ctrl+C to copy", trigger: "manual" });
            btn.tooltip('show');
            setTimeout(function() {
                btn.tooltip('hide');
            }, 1000);
        });

        return customClipboard;
    }

    function showModal(title, content, callback) {
        var modal = $('#form-modal');
        modal.find('.modal-title')
            .html(title);
        modal.find('.modal-body .p')
            .html(content);

        var cb = function() {
            if (callback) callback();
            modal.off('hidden.bs.modal', cb);
        };
        modal.on('hidden.bs.modal', cb);

        modal.modal();
    }

    ga('send', 'pageview');

})(window, jQuery, ko, _, ShiftCash);
