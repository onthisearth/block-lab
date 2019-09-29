/**
 * Used for editing Blocks.
 *
 * @package   Block_Lab
 * @copyright Copyright(c) 2019, Block Lab
 * @license http://opensource.org/licenses/GPL-2.0 GNU General Public License, version 2 (GPL-2.0)
 */

/* global blockLab, jQuery */

( function( $ ) {
	$( function() {
		blockTitleInit();
		blockIconInit();
		blockFieldInit();
		blockPostTypesInit();

		$( '#block-add-field' ).on( 'click', function() {
			const template = wp.template( 'field-repeater' ),
				data = { uid: new Date().getTime() },
				field = $( template( data ) ),
				edit = field.find( '.block-fields-actions-edit' ),
				label = field.find( '.block-fields-edit-label input' );

			$( '.block-fields-rows' ).append( field );
			$( '.block-no-fields' ).hide();
			$( '.block-lab-add-fields' ).hide();

			edit.trigger( 'click' );
			label.data( 'defaultValue', label.val() );
			label.select();
		} );

		$( '#block_fields' ).on( 'click', '#block-add-sub-field', function() {
			const template = wp.template( 'field-repeater' ),
				data = { uid: new Date().getTime() },
				field = $( template( data ) ),
				row = $( this ).closest( '.block-fields-row' ),
				edit = field.find( '.block-fields-actions-edit' ),
				label = field.find( '.block-fields-edit-label input' );

			// Prevents adding a repeater, in a repeater, in a repeater…
			field.find( '.block-fields-edit-control option[value="repeater"]' ).remove();

			// Don't render the location or width settings for sub-fields.
			field.find( '.block-fields-edit-location-settings' ).remove();
			field.find( '.block-fields-edit-width-settings' ).remove();

			// Add parent UID as a hidden input
			const parentInput = $( '<input>' ).attr( {
				type: 'hidden',
				name: 'block-fields-parent[' + data.uid + ']',
				value: row.find( 'input[name^="block-fields-name"]' ).val(),
			} );
			field.append( parentInput );

			$( '.block-fields-sub-rows', row ).append( field );
			$( '.repeater-no-fields', row ).hide();
			$( '.repeater-has-fields', row ).show();

			edit.trigger( 'click' );
			label.data( 'defaultValue', label.val() );
			label.select();
		} );

		$( '.block-lab-pub-section .edit-post-types' ).on( 'click', function() {
			const excludedPostTypes = $( '#block-excluded-post-types' ).val().split( ',' ).filter( Boolean );

			$( '.post-types-select-items input' ).prop( 'checked', true );

			for ( const postType of excludedPostTypes ) {
				$( '.post-types-select-items input[value="' + postType + '"]' ).prop( 'checked', false );
			}

			$( '.block-lab-pub-section .post-types-select' ).slideDown( 200 );
			$( this ).hide();
		} );

		$( '.block-lab-pub-section .save-post-types' ).on( 'click', function() {
			const checked = $( '.post-types-select-items input:not(:checked)' ),
				postTypes = [];
			for ( const input of checked ) {
				postTypes.push( $( input ).val() );
			}

			$( '#block-excluded-post-types' ).val( postTypes.join( ',' ) );

			blockPostTypesInit();

			$( '.block-lab-pub-section .post-types-select' ).slideUp( 200 );
			$( '.block-lab-pub-section .edit-post-types' ).show();
		} );

		$( '.block-lab-pub-section .button-cancel' ).on( 'click', function() {
			$( '.block-lab-pub-section .post-types-select' ).slideUp( 200 );
			$( '.block-lab-pub-section .edit-post-types' ).show();
		} );

		$( '#block_properties .block-properties-icon-select span' ).on( 'click', function() {
			const svg = $( 'svg', this ).clone();
			$( '#block_properties .block-properties-icon-select span.selected' ).removeClass( 'selected' );
			$( this ).addClass( 'selected' );
			$( '#block-properties-icon' ).val( $( this ).data( 'value' ) );
			$( '#block-properties-icon-current' ).html( svg );
		} );

		$( '#block_properties .block-properties-category' ).on( 'change', function() {
			if ( '__custom' === $( this ).val() ) {
				$( this ).next( '.block-properties-category-custom' ).css( 'display', 'block' );
			} else {
				$( this ).next( '.block-properties-category-custom' ).hide();
			}
		} );

		$( '#block_template .template-location a.filename' ).on( 'click', function( event ) {
			event.preventDefault();

			const copy = $( '#block_template .template-location .click-to-copy' ),
				input = $( 'input', copy ),
				width = $( this ).width() + input.outerWidth( false ) - input.width();

			copy.show();
			input.outerWidth( width ).focus().select();

			const copied = document.execCommand( 'copy' );

			if ( copied ) {
				copy.attr( 'data-tooltip', blockLab.copySuccessMessage );
			} else {
				copy.attr( 'data-tooltip', blockLab.copyFailMessage );
			}

			$( this ).hide();
		} );

		$( '#block_template .template-location .click-to-copy input' ).on( 'blur', function() {
			$( '#block_template .template-location a.filename' ).show();
			$( this ).parent().hide();
		} );

		$( '.block-fields-rows' )
			.on( 'click', '.block-fields-actions-delete', function() {
				const subRows = $( this ).closest( '.block-fields-sub-rows' );
				$( this ).closest( '.block-fields-row' ).remove();
				if ( 0 === $( '.block-fields-rows' ).children( '.block-fields-row' ).length ) {
					$( '.block-no-fields' ).show();
				}
				if ( 0 !== subRows.length && 0 === $( '.block-fields-row', subRows ).length ) {
					$( '.repeater-no-fields' ).show();
					$( '.repeater-has-fields' ).hide();
				}
			} )
			.on( 'click', '.block-fields-actions-duplicate', function() {
				const currentRow = $( this ).closest( '.block-fields-row' ),
					currentUid = currentRow.data( 'uid' ),
					newUid = new Date().getTime(),
					newRow = currentRow.clone();

				// Replace all the UIDs.
				newRow.attr( 'data-uid', newUid );
				newRow.html( function( index, html ) {
					return html.replace( new RegExp( currentUid, 'g' ), newUid );
				} );

				// Set the values manually. jQuery's clone method doesn't work for dynamic data.
				currentRow.find( '[name*="[' + currentUid + ']"]' ).each( function() {
					const newRowName = $( this ).attr( 'name' ).replace( currentUid, newUid ),
						newRowInput = newRow.find( '[name="' + newRowName + '"]' );

					// Radio and Checkbox inputs are unique in that multiple can exist with the same name.
					if ( $( this ).is( '[type="radio"],[type="checkbox"]' ) ) {
						newRowInput.parent().find( '[value="' + $( this ).val() + '"]' ).prop( 'checked', $( this ).prop( 'checked' ) );
					} else {
						newRowInput.val( $( this ).val() );
					}
				} );

				// Insert the new row.
				newRow.insertAfter( currentRow );

				if ( newRow.hasClass( 'block-fields-row-active' ) ) {
					currentRow.find( '.block-fields-actions-edit' ).trigger( 'click' );
				} else {
					newRow.find( '.block-fields-actions-edit' ).trigger( 'click' );
				}

				// Increment the label.
				const label = newRow.find( '.block-fields-edit-label input' ),
					labelNumbers = label.val().match( /\d+$/ );

				if ( labelNumbers ) {
					const newNumber = parseInt( labelNumbers[ 0 ] ) + 1;
					label.val( label.val().replace( /\d+$/, newNumber ) );
				} else {
					label.val( label.val() + ' 1' );
				}

				label.trigger( 'change' );
				label.data( 'defaultValue', label.val() );
				label.select();
			} )
			.on( 'click', '.block-fields-actions-edit, a.row-title', function() {
				const currentRow = $( this ).closest( '.block-fields-row' );

				// If we're expanding this row, first collapse all other rows and scroll this row into view.
				if ( ! currentRow.hasClass( 'block-fields-row-active' ) ) {
					const editRow = $( '.block-fields-rows .block-fields-edit' );

					scrollRowIntoView( currentRow );
					editRow.slideUp();

					$( '.block-fields-rows .block-fields-row-active' ).removeClass( 'block-fields-row-active' );
				}

				currentRow.toggleClass( 'block-fields-row-active' );
				currentRow.find( '.block-fields-edit' ).first().slideToggle();

				// Fetch field settings if field is active and there are no settings.
				if ( $( this ).closest( '.block-fields-row' ).hasClass( 'block-fields-row-active' ) ) {
					const fieldRow = $( this ).closest( '.block-fields-row' );
					if ( 0 === fieldRow.find( '.block-fields-edit-settings' ).length ) {
						const fieldControl = fieldRow.find( '.block-fields-edit-control select' ).val();
						fetchFieldSettings( fieldRow, fieldControl );
					}
				}
			} )
			.on( 'click', '.block-fields-edit-actions-close a.button', function() {
				const fieldRow = $( this ).closest( '.block-fields-row' );
				fieldRow.removeClass( 'block-fields-row-active' );
				$( '.block-fields-edit', fieldRow ).slideUp();
			} )
			.on( 'change keyup', '.block-fields-edit input', function() {
				const sync = $( this ).data( 'sync' );
				$( '#' + sync ).text( $( this ).val() );
			} )
			.on( 'change keyup', '.block-fields-edit select', function() {
				const sync = $( this ).data( 'sync' ),
					option = $( 'option:selected', $( this ) ).text();
				$( '#' + sync ).text( option );
			} )
			.on( 'change', '.block-fields-edit-control select', function() {
				const fieldRow = $( this ).closest( '.block-fields-row' );
				fetchFieldSettings( fieldRow, $( this ).val() );

				if ( 'repeater' === $( this ).val() ) {
					const subRows = wp.template( 'sub-field-rows' );
					fieldRow.append( subRows );
					blockFieldSubRowsInit( $( '.block-fields-sub-rows', fieldRow ) );
				} else {
					$( '.block-fields-sub-rows,.block-fields-sub-rows-actions', fieldRow ).remove();
				}
			} )
			.on( 'change', '.block-fields-edit-location-settings select', function() {
				blockFieldWidthInit( $( this ).closest( '.block-fields-row' ) );
			} )
			.on( 'change keyup', '.block-fields-edit-label input', function() {
				const slug = $( this )
					.closest( '.block-fields-edit' )
					.find( '.block-fields-edit-name input' );

				if ( 'false' !== slug.data( 'autoslug' ) ) {
					slug
						.val( slugify( $( this ).val() ) )
						.trigger( 'change' );
				}
			} )
			.on( 'blur', '.block-fields-edit-label input', function() {
				// If the value hasn't changed from default, don't turn off autoslug.
				if ( $( this ).data( 'defaultValue' ) === $( this ).val() ) {
					return;
				}
				$( this )
					.closest( '.block-fields-edit' )
					.find( '.block-fields-edit-name input' )
					.data( 'autoslug', 'false' );
			} )
			.on( 'mouseenter', '.block-fields-row div:not(.block-fields-edit,.block-fields-sub-rows,.block-fields-sub-rows-actions)', function() {
				$( this ).parent().addClass( 'hover' );
			} )
			.on( 'mouseleave', '.block-fields-row div', function() {
				$( this ).parent().removeClass( 'hover' );
			} )
			.sortable( {
				axis: 'y',
				cursor: 'grabbing',
				handle: '> .block-fields-row-columns .block-fields-sort-handle',
				containment: 'parent',
				tolerance: 'pointer',
			} );
	} );

	const blockTitleInit = function() {
		const title = $( '#title' ),
			slug = $( '#block-properties-slug' );

		// If this is a new block, then enable auto-generated slugs.
		if ( '' === title.val() && '' === slug.val() ) {
			// If auto-generated slugs are enabled, set the slug based on the title.
			title.on( 'change keyup', function() {
				if ( 'false' !== slug.data( 'autoslug' ) ) {
					slug.val( slugify( title.val() ) );
				}
			} );

			// Turn auto-generated slugs off once a title has been set.
			title.on( 'blur', function() {
				if ( '' !== title.val() ) {
					slug.data( 'autoslug', 'false' );
				}
			} );
		}
	};

	const blockIconInit = function() {
		const iconsContainer = $( '.block-properties-icon-select' ),
			selectedIcon = $( '.selected', iconsContainer );
		if ( 0 !== iconsContainer.length && 0 !== selectedIcon.length ) {
			iconsContainer.scrollTop( selectedIcon.position().top );
		}
	};

	const blockFieldInit = function() {
		if ( 0 === $( '.block-fields-rows' ).children( '.block-fields-row' ).length ) {
			$( '.block-no-fields' ).show();
		}
		$( '.block-fields-edit-name input' ).data( 'autoslug', 'false' );
		$( '.block-fields-sub-rows' ).each( function() {
			blockFieldSubRowsInit( $( this ) );
		} );
	};

	const blockFieldSubRowsInit = function( subRows ) {
		subRows.sortable( {
			axis: 'y',
			cursor: 'grabbing',
			handle: '> .block-fields-row-columns .block-fields-sort-handle',
			containment: 'parent',
			tolerance: 'pointer',
		} );
	};

	const blockFieldWidthInit = function( fieldRow ) {
		const widthSettings = fieldRow.find( '.block-fields-edit-width-settings' ),
			locationSettings = fieldRow.find( '.block-fields-edit-location-settings' );

		if ( 'editor' !== $( 'select', locationSettings ).val() ) {
			widthSettings.hide();
		} else {
			widthSettings.show();
		}
	};

	const blockPostTypesInit = function() {
		if ( 0 === $( '.block-lab-pub-section' ).length ) {
			return;
		}

		const display = $( '.post-types-display' );

		const excludedPostTypes = $( '#block-excluded-post-types' )
			.val()
			.split( ',' )
			.filter( Boolean );

		if ( 0 === excludedPostTypes.length ) {
			display.text( blockLab.postTypes.all );
			return;
		}

		const inputs = $( '.post-types-select-items input' );

		if ( excludedPostTypes.length === inputs.length ) {
			display.text( blockLab.postTypes.none );
			return;
		}

		const displayList = [];
		for ( const input of inputs ) {
			const postType = $( input ).val();
			if ( -1 === excludedPostTypes.indexOf( postType ) ) {
				displayList.push(
					$( input ).next( 'label' ).text()
				);
			}
		}

		display.text( displayList.join( ', ' ) );
	};

	const fetchFieldSettings = function( fieldRow, fieldControl ) {
		if ( ! blockLab.hasOwnProperty( 'fieldSettingsNonce' ) ) {
			return;
		}

		const loadingRow = '' +
			'<tr class="block-fields-edit-loading">' +
			'   <td class="spacer"></td>' +
			'   <th></th>' +
			'   <td><span class="loading"></span></td>' +
			'</tr>';

		$( '.block-fields-edit-settings', fieldRow ).remove();
		$( '.block-fields-edit-control', fieldRow ).after( $( loadingRow ) );

		const data = {
			control: fieldControl,
			uid: fieldRow.data( 'uid' ),
			nonce: blockLab.fieldSettingsNonce,
		};

		// If this is a sub-field, pass along the parent UID as well.
		if ( fieldRow.parent( '.block-fields-sub-rows' ).length > 0 ) {
			data.parent = fieldRow.closest( '.block-fields-row' ).data( 'uid' );
		}

		wp.ajax.send( 'fetch_field_settings', {
			success( result ) {
				$( '.block-fields-edit-loading', fieldRow ).remove();

				if ( ! result.hasOwnProperty( 'html' ) ) {
					return;
				}
				const settingsRows = $( result.html );
				$( '.block-fields-edit-control', fieldRow ).after( settingsRows );
				blockFieldWidthInit( fieldRow );
				scrollRowIntoView( fieldRow );
			},
			error() {
				$( '.block-fields-edit-loading', fieldRow ).remove();
			},
			data,
		} );
	};

	const scrollRowIntoView = function( row ) {
		let scrollTop = 0;

		$( '.block-fields-rows .block-fields-row' ).each( function() {
			// Add the height of all previous rows to the target scrollTop position.
			if ( $( this ).is( row ) ) {
				return false;
			}

			const height = $( this ).children().first().outerHeight();
			scrollTop += height;
		} );

		$( 'body' ).animate( { scrollTop } );
	};

	const slugify = function( text ) {
		return text
			.toLowerCase()
			.replace( /[^\w ]+/g, '' )
			.replace( / +/g, '-' )
			.replace( /_+/g, '-' );
	};
}( jQuery ) );
