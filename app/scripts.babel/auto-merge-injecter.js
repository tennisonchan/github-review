let buttonTextForMerge = 'Auto-merge when Build Succeeds';
let buttonTextForCancel = 'Cancel Auto-merge';
let buttonTextForConfirm = 'Confirm Auto-merge';

class AutoMergeButtonInjecter {
  constructor() {
    console.log('AutoMergeButtonInjecter init');
    this.autoMergeButtonAppendTargetSelector = '.merge-message';
    this.confirmButtonAppendTargetSelector = '.commit-form-actions .btn-group-merge';
    this.mergePrButtonSelector = '.js-details-target[type=submit]';
    this.hideMergeMessageSelectors = '.alt-merge-options, .merge-branch-manually';
    this.confirmed = false;
    this.autoButton = new Button({
      class: 'btn btn-primary js-details-target auto-merge-button',
      text: buttonTextForMerge
    });
    this.confirmButton = new Button({
      class: 'btn btn-primary js-details-target confirm-button is-show',
      text: buttonTextForConfirm
    });
  }

  inject(clickHandler) {
    this.hideMergeMessage();
    console.log('in inject van auto-merge-injecter');
    if (!this.autoButton.present) {
      this.autoButton.on({ click: clickHandler });
    }
    this.autoButton.append('appendTo', this.autoMergeButtonAppendTargetSelector);
    $(this.mergePrButtonSelector).on({
      click: () => {
        this.confirmButton.present && this.confirmButton.el.removeClass('is-show');
      }
    });
  }

  setState({ confirmed, isOwner, autoMergeBy }) {
    this.confirmed = confirmed;
    this.autoButton.el.toggleClass('btn-primary', !confirmed);
    if(confirmed) {
      this.autoButton.setDisability(!isOwner);
      this.autoButton.setTooltips(autoMergeBy);
      this.autoButton.changeText(buttonTextForCancel);
      this.autoButton.el.removeAttr('data-details-container');
    } else {
      this.autoButton.removeTooltips();
      this.autoButton.changeText(buttonTextForMerge);
      this.autoButton.el.attr('data-details-container', '.js-merge-pr');
    }
  }

  hideMergeMessage() {
    $(this.hideMergeMessageSelectors).hide();
  }

  injectConfirmButton(clickHandler) {
    if (!this.confirmButton.present) {
      this.confirmButton.on({ click: clickHandler });
    }
    this.confirmButton.append('insertBefore', this.confirmButtonAppendTargetSelector);
    this.confirmButton.el.addClass('is-show');
  }
}
