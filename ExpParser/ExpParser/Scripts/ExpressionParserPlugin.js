
function expressionParserPlugin() {

    var checkRules = function (btnAddRule) {
        var rules = $(btnAddRule).parents("dl").first().children("dd").first().children("ul").children();

        if (rules.length === 2) {
            $(btnAddRule).parent().hide();
            for (var i = 0; i < rules.length; i++) {
                var rule = rules[i];
                switch (rule.tagName) {
                    case "DL":
                        var divGroupButtons = $(rule).children("dt").children("div.btn-group.pull-right.group-actions");

                        var addRuleGroupeButton = divGroupButtons.children("button.btn.btn-xs.btn-success:contains('Add rule')");
                        if (addRuleGroupeButton && addRuleGroupeButton.attr("hasdelegate") != "true") {
                            addRuleGroupeButton.attr("hasdelegate", "true");
                            $(document).on("click", "button.btn.btn-xs.btn-success:contains('Add rule')", function () {
                                checkRules(this);
                            });
                        }

                        var addGroupGroupeButton = divGroupButtons.children("button.btn.btn-xs.btn-success:contains('Add group')");
                        if (addGroupGroupeButton && addGroupGroupeButton.attr("hasdelegate") != "true") {
                            addGroupGroupeButton.attr("hasdelegate", "true");
                            $(document).on("click", "button.btn.btn-xs.btn-success:contains('Add group')", function () {
                                checkRules(this);
                            });
                        }


                        var deleteGroupButon = divGroupButtons.children("button.btn.btn-xs.btn-danger");
                        if (deleteGroupButon && deleteGroupButon.attr("hasdelegate") != "true") {
                            deleteGroupButon.attr("hasdelegate", true);
                            deleteGroupButon.on("click", function () {
                                $(btnAddRule).parent().show();
                            });
                        }
                        break;
                    case "LI":
                        var deleteRuleButon = $(rule).children("div.rule-header").children("div").children("button");
                        if (deleteRuleButon && deleteRuleButon.attr("hasdelegate") != "true") {
                            deleteRuleButon.attr("hasdelegate", true);
                            deleteRuleButon.on("click", function () {
                                $(btnAddRule).parent().show();
                            });
                        }
                        break;

                }

            }
        }
    }

    $(document).on("click", "#builder-basic_group_0 > dt > div.btn-group.pull-right.group-actions > button:contains('Add rule')", function () {
        checkRules(this);
    });

    $(document).on("click", "#builder-basic_group_0 > dt > div.btn-group.pull-right.group-actions > button:contains('Add group')", function () {
        checkRules(this);
    });

    $("#builder-basic_rule_1 > div.rule-header > div > button").on("click", function () {
        var parentGroup = this.parent;
    });

};



