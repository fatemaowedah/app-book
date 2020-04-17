'use strict';
$(document).ready(function () {


    $('#list').hide();
    $('#targ').on('click', () => {
        $('#list').toggle();
    });


    for (let i = 0; i < 10; i++) {
        $('#formAdd'+i).hide();
        $('#show'+i).on('click', () => {
            $('#formAdd'+i).toggle();
        });
    }
    $('#formDetail').hide();
    $('#update').on('click', () => {
        $('#formDetail').toggle();
    });

});